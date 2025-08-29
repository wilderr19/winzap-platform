const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad y optimización
app.use(helmet({
    contentSecurityPolicy: false // Permitir inline scripts para demo
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(__dirname));

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Generar nombre único para evitar conflictos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB límite
        files: 2 // Máximo 2 archivos (imagen + archivo principal)
    },
    fileFilter: (req, file, cb) => {
        // Permitir todos los tipos de archivo para flexibilidad
        cb(null, true);
    }
});

// Base de datos simple en memoria (en producción usar MongoDB/PostgreSQL)
let filesDatabase = [];
let statsDatabase = {
    totalFiles: 0,
    totalDownloads: 0,
    visitorsToday: 0,
    lastResetDate: new Date().toDateString()
};

// Cargar datos existentes si existen
const dbFile = path.join(__dirname, 'database.json');
if (fs.existsSync(dbFile)) {
    try {
        const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
        filesDatabase = data.files || [];
        statsDatabase = { ...statsDatabase, ...data.stats };
    } catch (error) {
        console.log('Error cargando base de datos:', error.message);
    }
}

// Función para guardar datos
function saveDatabase() {
    const data = {
        files: filesDatabase,
        stats: statsDatabase
    };
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

// Rutas de la API

// Obtener todos los archivos
app.get('/api/files', (req, res) => {
    const { search } = req.query;
    let files = filesDatabase;
    
    if (search) {
        files = files.filter(file => 
            file.title.toLowerCase().includes(search.toLowerCase()) ||
            file.description.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    res.json(files);
});

// Obtener un archivo específico
app.get('/api/files/:id', (req, res) => {
    const file = filesDatabase.find(f => f.id === parseInt(req.params.id));
    if (!file) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    res.json(file);
});

// Subir nuevo archivo
app.post('/api/upload', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]), (req, res) => {
    try {
        const { title, description } = req.body;
        const coverImage = req.files['coverImage'] ? req.files['coverImage'][0] : null;
        const mainFile = req.files['file'] ? req.files['file'][0] : null;

        if (!title || !description || !coverImage || !mainFile) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos: título, descripción, imagen de portada y archivo' 
            });
        }

        const newFile = {
            id: Date.now(),
            title: title.trim(),
            description: description.trim(),
            coverImage: `/uploads/${coverImage.filename}`,
            fileName: mainFile.originalname,
            filePath: `/uploads/${mainFile.filename}`,
            fileSize: formatFileSize(mainFile.size),
            fileType: mainFile.mimetype,
            uploadDate: new Date().toLocaleDateString('es-ES'),
            downloads: 0,
            uploadedAt: new Date().toISOString()
        };

        filesDatabase.push(newFile);
        statsDatabase.totalFiles = filesDatabase.length;
        saveDatabase();

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
    const file = filesDatabase.find(f => f.id === parseInt(req.params.id));
    
    if (!file) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const filePath = path.join(__dirname, file.filePath);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Archivo físico no encontrado' });
    }

    // Incrementar contador de descargas
    file.downloads++;
    statsDatabase.totalDownloads++;
    saveDatabase();

    // Enviar archivo
    res.download(filePath, file.fileName, (err) => {
        if (err) {
            console.error('Error en descarga:', err);
            res.status(500).json({ error: 'Error al descargar archivo' });
        }
    });
});

// Eliminar archivo (solo admin)
app.delete('/api/files/:id', (req, res) => {
    const fileIndex = filesDatabase.findIndex(f => f.id === parseInt(req.params.id));
    
    if (fileIndex === -1) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const file = filesDatabase[fileIndex];
    
    // Eliminar archivos físicos
    try {
        const coverPath = path.join(__dirname, file.coverImage);
        const filePath = path.join(__dirname, file.filePath);
        
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (error) {
        console.error('Error eliminando archivos físicos:', error);
    }

    // Eliminar de base de datos
    filesDatabase.splice(fileIndex, 1);
    statsDatabase.totalFiles = filesDatabase.length;
    saveDatabase();

    res.json({ message: 'Archivo eliminado exitosamente' });
});

// Actualizar archivo (solo admin)
app.put('/api/files/:id', (req, res) => {
    const file = filesDatabase.find(f => f.id === parseInt(req.params.id));
    
    if (!file) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const { title, description } = req.body;
    
    if (title) file.title = title.trim();
    if (description) file.description = description.trim();
    
    saveDatabase();
    
    res.json({
        message: 'Archivo actualizado exitosamente',
        file: file
    });
});

// Obtener estadísticas
app.get('/api/stats', (req, res) => {
    // Resetear visitantes si es un nuevo día
    const today = new Date().toDateString();
    if (statsDatabase.lastResetDate !== today) {
        statsDatabase.visitorsToday = 0;
        statsDatabase.lastResetDate = today;
        saveDatabase();
    }

    res.json(statsDatabase);
});

// Registrar visita
app.post('/api/visit', (req, res) => {
    const today = new Date().toDateString();
    
    if (statsDatabase.lastResetDate !== today) {
        statsDatabase.visitorsToday = 0;
        statsDatabase.lastResetDate = today;
    }
    
    statsDatabase.visitorsToday++;
    saveDatabase();
    
    res.json({ message: 'Visita registrada' });
});

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Función auxiliar para formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Archivo demasiado grande (máx. 100MB)' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Demasiados archivos' });
        }
    }
    
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
🎮 WINZAP GAMER Server iniciado!
🌐 URL: http://localhost:${PORT}
📁 Uploads: ${uploadsDir}
🚀 Listo para recibir archivos gaming!
    `);
});

module.exports = app;
