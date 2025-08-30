const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de límites de velocidad
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 requests por IP
    message: 'Demasiadas solicitudes, intenta más tarde'
});

// Middleware de seguridad y optimización
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

app.use(compression());
app.use(cors({
    origin: ['https://winzapg.online', 'https://www.winzapg.online', 'https://wilderr19.github.io', 'http://localhost:3000'],
    credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static(__dirname, {
    maxAge: '1d',
    etag: true
}));

// Crear directorios necesarios
const uploadsDir = path.join(__dirname, 'uploads');
const imagesDir = path.join(__dirname, 'uploads', 'images');
const filesDir = path.join(__dirname, 'uploads', 'files');

[uploadsDir, imagesDir, filesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isImage = file.fieldname === 'coverImage';
        const dir = isImage ? 'uploads/images' : 'uploads/files';
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, '-')
            .substring(0, 50);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB límite
        files: 2
    },
    fileFilter: (req, file, cb) => {
        // Validar tipos de archivo
        if (file.fieldname === 'coverImage') {
            const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
            const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedImageTypes.test(file.mimetype);
            
            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
            }
        } else {
            // Permitir todos los tipos para archivos principales
            cb(null, true);
        }
    }
});

// Base de datos JSON persistente
const dbFile = path.join(__dirname, 'winzap-database.json');
let database = {
    files: [],
    stats: {
        totalFiles: 0,
        totalDownloads: 0,
        visitorsToday: 0,
        lastResetDate: new Date().toDateString()
    },
    settings: {
        siteName: 'WINZAP',
        adminPassword: 'winzap2024', // Cambiar en producción
        maxFileSize: 500 * 1024 * 1024
    }
};

// Cargar base de datos existente
function loadDatabase() {
    if (fs.existsSync(dbFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
            database = { ...database, ...data };
            console.log(`📊 Base de datos cargada: ${database.files.length} archivos`);
        } catch (error) {
            console.error('❌ Error cargando base de datos:', error.message);
        }
    }
}

// Guardar base de datos
function saveDatabase() {
    try {
        fs.writeFileSync(dbFile, JSON.stringify(database, null, 2));
    } catch (error) {
        console.error('❌ Error guardando base de datos:', error.message);
    }
}

// Cargar datos al iniciar
loadDatabase();

// RUTAS DE LA API

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        files: database.files.length
    });
});

// Obtener todos los archivos
app.get('/api/files', (req, res) => {
    try {
        const { search, category, limit = 50, offset = 0 } = req.query;
        let files = [...database.files];
        
        // Filtrar por búsqueda
        if (search) {
            const searchTerm = search.toLowerCase();
            files = files.filter(file => 
                file.title.toLowerCase().includes(searchTerm) ||
                file.description.toLowerCase().includes(searchTerm) ||
                file.category?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filtrar por categoría
        if (category && category !== 'all') {
            files = files.filter(file => file.category === category);
        }
        
        // Ordenar por fecha de subida (más recientes primero)
        files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        
        // Paginación
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedFiles = files.slice(startIndex, endIndex);
        
        res.json({
            files: paginatedFiles,
            total: files.length,
            hasMore: endIndex < files.length
        });
    } catch (error) {
        console.error('Error obteniendo archivos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener archivo específico
app.get('/api/files/:id', (req, res) => {
    try {
        const file = database.files.find(f => f.id === req.params.id);
        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        res.json(file);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Subir nuevo archivo
app.post('/api/upload', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]), (req, res) => {
    try {
        const { title, description, category = 'general' } = req.body;
        const coverImage = req.files['coverImage'] ? req.files['coverImage'][0] : null;
        const mainFile = req.files['file'] ? req.files['file'][0] : null;

        // Validaciones
        if (!title || !description) {
            return res.status(400).json({ 
                error: 'Título y descripción son requeridos' 
            });
        }

        if (!coverImage || !mainFile) {
            return res.status(400).json({ 
                error: 'Imagen de portada y archivo principal son requeridos' 
            });
        }

        const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        
        const newFile = {
            id: fileId,
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            coverImage: `/uploads/images/${coverImage.filename}`,
            fileName: mainFile.originalname,
            filePath: `/uploads/files/${mainFile.filename}`,
            fileSize: formatFileSize(mainFile.size),
            fileSizeBytes: mainFile.size,
            fileType: mainFile.mimetype,
            fileExtension: path.extname(mainFile.originalname).toLowerCase(),
            uploadDate: new Date().toLocaleDateString('es-ES'),
            uploadedAt: new Date().toISOString(),
            downloads: 0,
            views: 0,
            featured: false
        };

        database.files.push(newFile);
        database.stats.totalFiles = database.files.length;
        saveDatabase();

        console.log(`📁 Nuevo archivo subido: ${newFile.title}`);

        res.status(201).json({
            message: 'Archivo subido exitosamente',
            file: newFile
        });

    } catch (error) {
        console.error('Error en upload:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Descargar archivo
app.get('/api/download/:id', (req, res) => {
    try {
        const file = database.files.find(f => f.id === req.params.id);
        
        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        const filePath = path.join(__dirname, file.filePath);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo físico no encontrado' });
        }

        // Incrementar contadores
        file.downloads++;
        database.stats.totalDownloads++;
        saveDatabase();

        console.log(`⬇️ Descarga: ${file.title} (${file.downloads} descargas)`);

        // Enviar archivo con headers apropiados
        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
        res.setHeader('Content-Type', file.fileType);
        res.sendFile(filePath);

    } catch (error) {
        console.error('Error en descarga:', error);
        res.status(500).json({ error: 'Error al descargar archivo' });
    }
});

// Incrementar vistas
app.post('/api/files/:id/view', (req, res) => {
    try {
        const file = database.files.find(f => f.id === req.params.id);
        if (file) {
            file.views = (file.views || 0) + 1;
            saveDatabase();
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener estadísticas
app.get('/api/stats', (req, res) => {
    try {
        // Resetear visitantes diarios
        const today = new Date().toDateString();
        if (database.stats.lastResetDate !== today) {
            database.stats.visitorsToday = 0;
            database.stats.lastResetDate = today;
            saveDatabase();
        }

        res.json(database.stats);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// Registrar visita
app.post('/api/visit', (req, res) => {
    try {
        const today = new Date().toDateString();
        
        if (database.stats.lastResetDate !== today) {
            database.stats.visitorsToday = 0;
            database.stats.lastResetDate = today;
        }
        
        database.stats.visitorsToday++;
        saveDatabase();
        
        res.json({ message: 'Visita registrada' });
    } catch (error) {
        res.status(500).json({ error: 'Error registrando visita' });
    }
});

// RUTAS ADMIN (protegidas)

// Eliminar archivo
app.delete('/api/admin/files/:id', (req, res) => {
    try {
        const { password } = req.body;
        
        if (password !== database.settings.adminPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const fileIndex = database.files.findIndex(f => f.id === req.params.id);
        
        if (fileIndex === -1) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        const file = database.files[fileIndex];
        
        // Eliminar archivos físicos
        try {
            const coverPath = path.join(__dirname, file.coverImage);
            const filePath = path.join(__dirname, file.filePath);
            
            if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Error eliminando archivos físicos:', error);
        }

        database.files.splice(fileIndex, 1);
        database.stats.totalFiles = database.files.length;
        saveDatabase();

        console.log(`🗑️ Archivo eliminado: ${file.title}`);
        res.json({ message: 'Archivo eliminado exitosamente' });

    } catch (error) {
        res.status(500).json({ error: 'Error eliminando archivo' });
    }
});

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    etag: true
}));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Función auxiliar para formatear tamaño
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Manejo de errores
app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Archivo demasiado grande (máx. 500MB)' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Demasiados archivos' });
        }
    }
    
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🎮 WINZAP VPS Server iniciado!
🌐 Puerto: ${PORT}
📁 Archivos: ${database.files.length}
📊 Descargas totales: ${database.stats.totalDownloads}
🚀 Listo para producción!
    `);
});

// Guardar base de datos cada 5 minutos
setInterval(saveDatabase, 5 * 60 * 1000);

module.exports = app;
