// WINZAP GAMER - JavaScript Principal
class WinzapGamer {
    constructor() {
        this.files = [];
        this.stats = {
            totalFiles: 0,
            totalDownloads: 0,
            visitorsToday: 0
        };
        this.firebaseManager = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        
        // Verificar conexión con VPS API
        if (window.apiConfig && window.apiConfig.baseURL) {
            try {
                const health = await window.apiConfig.checkHealth();
                if (health.status === 'OK') {
                    console.log('🌐 VPS API conectado - usando servidor remoto');
                    this.loadFilesFromAPI();
                    this.registerVisit();
                    return;
                }
            } catch (error) {
                console.log('⚠️ VPS API no disponible, intentando Firebase...');
            }
        }
        
        // Usar Firebase como principal hasta tener VPS
        this.initFirebaseBackup();
        this.setupStorageSync();
    }

    async initFirebaseBackup() {
        // Inicializar Firebase como backup
        if (window.FirebaseManager) {
            this.firebaseManager = new window.FirebaseManager();
            const initialized = await this.firebaseManager.init();
            
            if (initialized) {
                console.log('🔥 Firebase conectado - usando base de datos en la nube');
                this.loadFilesFromFirebase();
            } else {
                console.log('📱 Firebase no disponible - usando localStorage');
                this.loadFilesFromLocal();
            }
        } else {
            console.log('📱 Firebase no disponible - usando localStorage');
            this.loadFilesFromLocal();
        }
    }

    // Cargar archivos desde VPS API
    async loadFilesFromAPI() {
        try {
            const response = await window.apiConfig.getFiles({ limit: 50 });
            this.files = response.files || [];
            this.loadFiles();
            console.log(`📁 Cargados ${this.files.length} archivos desde VPS`);
        } catch (error) {
            console.error('Error cargando desde API:', error);
            this.initFirebaseBackup();
        }
    }

    // Registrar visita en VPS
    async registerVisit() {
        try {
            await window.apiConfig.registerVisit();
        } catch (error) {
            console.error('Error registrando visita:', error);
        }
    }

    // Cargar archivos desde Firebase
    loadFilesFromFirebase() {
        if (this.firebaseManager) {
            this.firebaseManager.getFiles((files) => {
                this.files = files;
                this.loadFiles();
            });
        }
    }

    // Cargar archivos desde localStorage (fallback)
    loadFilesFromLocal() {
        this.files = JSON.parse(localStorage.getItem('winzap_files')) || [];
        this.loadFiles();
        
        // Escuchar cambios en localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'winzap_files') {
                this.files = JSON.parse(localStorage.getItem('winzap_files')) || [];
                this.loadFiles();
            }
        });
    }

    setupEventListeners() {
        // Admin upload form
        const adminUploadForm = document.getElementById('admin-upload-form');
        if (adminUploadForm) {
            adminUploadForm.addEventListener('submit', (e) => this.handleAdminUpload(e));
        }

        // Admin file inputs
        const adminCoverImageInput = document.getElementById('admin-cover-image');
        if (adminCoverImageInput) {
            adminCoverImageInput.addEventListener('change', (e) => this.previewAdminImage(e));
        }

        const adminFileInput = document.getElementById('admin-file');
        if (adminFileInput) {
            adminFileInput.addEventListener('change', (e) => this.showAdminFileInfo(e));
        }

        // Search
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchFiles(e.target.value));
        }

        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const navMenu = document.getElementById('nav-menu');
        if (mobileMenuBtn && navMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            });
        }

    }

    previewAdminImage(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('admin-image-preview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    }

    showAdminFileInfo(event) {
        const file = event.target.files[0];
        const fileInfo = document.getElementById('admin-file-info');
        
        if (file) {
            const size = this.formatFileSize(file.size);
            const type = file.type || 'Desconocido';
            fileInfo.innerHTML = `
                <strong>Archivo:</strong> ${file.name}<br>
                <strong>Tamaño:</strong> ${size}<br>
                <strong>Tipo:</strong> ${type}
            `;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleAdminUpload(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const title = formData.get('title');
        const description = formData.get('description');
        const coverImage = formData.get('cover-image');
        const file = formData.get('file');

        if (!title || !description || !coverImage || !file) {
            this.showMessage('Por favor completa todos los campos', 'error');
            return;
        }

        // Simular subida de archivo
        this.showMessage('Subiendo archivo...', 'info');
        
        try {
            // Convertir imagen a base64 para almacenamiento local
            const coverImageBase64 = await this.fileToBase64(coverImage);
            
            const newFile = {
                id: Date.now(),
                title: title,
                description: description,
                coverImage: coverImageBase64,
                fileName: file.name,
                fileSize: this.formatFileSize(file.size),
                fileType: file.type,
                uploadDate: new Date().toLocaleDateString('es-ES'),
                downloads: 0
            };

            this.files.push(newFile);
            this.saveFiles();
            this.updateStats();
            this.loadFiles();
            
            // Limpiar formulario admin
            event.target.reset();
            document.getElementById('admin-image-preview').innerHTML = '';
            document.getElementById('admin-file-info').innerHTML = '';
            
            this.showMessage('¡Archivo subido exitosamente!', 'success');
            
        } catch (error) {
            this.showMessage('Error al subir el archivo', 'error');
            console.error('Error:', error);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }


    loadFiles() {
        console.log('Cargando archivos:', this.files);
        const filesGrid = document.getElementById('files-grid');
        if (!filesGrid) {
            console.log('No se encontró files-grid');
            return;
        }

        if (this.files.length === 0) {
            console.log('No hay archivos para mostrar');
            filesGrid.innerHTML = `
                <div class="no-files">
                    <i class="fas fa-folder-open fa-3x"></i>
                    <h3>No hay archivos disponibles</h3>
                    <p>Los archivos aparecerán aquí cuando se suban desde el panel de administración.</p>
                </div>
            `;
            return;
        }

        console.log('Generando HTML para archivos');
        filesGrid.innerHTML = this.files.map(file => {
            console.log('Procesando archivo:', file.title, 'Imagen:', file.coverImage || file.image);
            return `
            <div class="file-card">
                <img src="${file.coverImage || file.image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\' viewBox=\'0 0 300 200\'%3E%3Crect width=\'300\' height=\'200\' fill=\'%23666\'/%3E%3Ctext x=\'150\' y=\'100\' text-anchor=\'middle\' dy=\'.3em\' fill=\'white\' font-family=\'Arial\' font-size=\'16\'%3ESin Imagen%3C/text%3E%3C/svg%3E'}" alt="${file.title}" onerror="console.log('Error cargando imagen:', this.src)">
                <div class="file-card-content">
                    <h3>${file.title}</h3>
                    <p>${file.description}</p>
                    <div class="file-meta">
                        <span class="category-badge category-${file.category || 'otros'}">${file.category || 'otros'}</span>
                        <span><i class="fas fa-calendar"></i> ${file.uploadDate}</span>
                        <span><i class="fas fa-download"></i> ${file.downloads}</span>
                        <span><i class="fas fa-file"></i> ${file.fileSize}</span>
                    </div>
                    <button class="download-btn" onclick="console.log('Click descarga archivo ID:', ${file.id}); window.winzap.downloadFile(${file.id})">
                        <i class="fas fa-download"></i> Descargar
                    </button>
                </div>
            </div>
            `;
        }).join('');
        console.log('HTML generado y asignado');
    }

    searchFiles(query) {
        const filteredFiles = this.files.filter(file => 
            file.title.toLowerCase().includes(query.toLowerCase()) ||
            file.description.toLowerCase().includes(query.toLowerCase()) ||
            file.category.toLowerCase().includes(query.toLowerCase())
        );
        
        const filesGrid = document.getElementById('files-grid');
        if (!filesGrid) return;

        if (filteredFiles.length === 0 && query.trim() !== '') {
            filesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; opacity: 0.7;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <p>No se encontraron archivos para "${query}"</p>
                    <button onclick="winzap.clearSearch()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-times"></i> Limpiar búsqueda
                    </button>
                </div>
            `;
            return;
        }

        if (query.trim() === '') {
            this.loadFiles();
            return;
        }

        filesGrid.innerHTML = filteredFiles.map(file => `
            <div class="file-card">
                <img src="${file.coverImage || file.image}" alt="${file.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM2Mzc0OGYiLz48L3N2Zz4='">
                <div class="file-info">
                    <h3>${file.title}</h3>
                    <p>${file.description}</p>
                    <div class="file-meta">
                        <span class="category-badge category-${file.category}">${this.getCategoryName(file.category)}</span>
                        <span class="file-size">${file.fileSize}</span>
                        <span class="download-count" id="downloads-${file.id}"><i class="fas fa-download"></i> ${file.downloads || 0} descargas</span>
                    </div>
                </div>
                <button onclick="winzap.downloadFile(${file.id})">
                    <i class="fas fa-download"></i> Descargar
                </button>
            </div>
        `).join('');
    }

    clearSearch() {
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.loadFiles();
    }

    getCategoryName(category) {
        const categoryNames = {
            'http-custom': 'HTTP CUSTOM',
            'zivpn': 'ZIVPN',
            'npv-tunnel': 'NPV TUNNEL',
            'nexprime': 'NEXPRIME',
            'http-injector': 'HTTP INJECTOR',
            'acm-custom-socksip': 'ACM CUSTOM SOCKSIP',
            'personalizada': 'PERSONALIZADA'
        };
        return categoryNames[category] || category.toUpperCase();
    }

    downloadFile(id) {
        console.log('downloadFile llamado con ID:', id);
        const file = this.files.find(f => f.id === id);
        console.log('Archivo encontrado:', file);
        
        if (file) {
            // Mostrar modal de descarga con anuncio
            this.showDownloadModal(file);
        } else {
            console.log('No se encontró archivo con ID:', id);
        }
    }

    showDownloadModal(file) {
        const modal = document.getElementById('download-modal');
        const modalImage = document.getElementById('modal-file-image');
        const modalTitle = document.getElementById('modal-file-title');
        const modalDescription = document.getElementById('modal-file-description');
        const modalSize = document.getElementById('modal-file-size');
        const modalType = document.getElementById('modal-file-type');
        const downloadBtn = document.getElementById('download-btn');
        const countdown = document.getElementById('countdown');
        
        // Llenar información del archivo
        modalImage.src = file.coverImage || file.image;
        modalImage.alt = file.title;
        modalTitle.textContent = file.title;
        modalDescription.textContent = file.description;
        modalSize.textContent = file.fileSize || '2.5 MB';
        modalType.textContent = file.category;
        
        // Mostrar modal
        modal.style.display = 'flex';
        
        // Iniciar countdown
        let timeLeft = 5;
        countdown.textContent = timeLeft;
        
        const timer = setInterval(() => {
            timeLeft--;
            countdown.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                // Habilitar botón de descarga
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> Descargar Ahora';
                downloadBtn.onclick = () => this.startDownload(file);
            }
        }, 1000);
    }

    startDownload(file) {
        // Incrementar contador de descargas
        const files = JSON.parse(localStorage.getItem('winzap_files')) || [];
        const fileIndex = files.findIndex(f => f.id === file.id);
        if (fileIndex !== -1) {
            files[fileIndex].downloads = (files[fileIndex].downloads || 0) + 1;
            localStorage.setItem('winzap_files', JSON.stringify(files));
            this.files = files;
            
            // Actualizar estadísticas globales
            const stats = JSON.parse(localStorage.getItem('winzap_stats')) || {
                totalFiles: 0,
                totalDownloads: 0,
                visitorsToday: 0
            };
            stats.totalDownloads = (stats.totalDownloads || 0) + 1;
            localStorage.setItem('winzap_stats', JSON.stringify(stats));
            
            // Actualizar contador visual en tiempo real
            this.updateDownloadCounter(file.id, files[fileIndex].downloads);
        }
        
        // Cerrar modal
        this.closeDownloadModal();
        
        // Simular descarga real
        if (file.fileUrl) {
            // Si hay URL real del archivo, descargar
            const link = document.createElement('a');
            link.href = file.fileUrl;
            link.download = file.fileName || file.title;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Descarga simulada
            const blob = new Blob(['Contenido del archivo simulado'], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.fileName || `${file.title}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        
        // Mostrar mensaje de éxito
        this.showNotification('¡Descarga iniciada correctamente!', 'success');
    }

    updateDownloadCounter(fileId, newCount) {
        // Actualizar contador específico del archivo
        const downloadCountElement = document.getElementById(`downloads-${fileId}`);
        if (downloadCountElement) {
            downloadCountElement.innerHTML = `<i class="fas fa-download"></i> ${newCount} descargas`;
        }
        
        // Notificar al panel admin si está abierto
        this.notifyAdminPanel();
    }

    setupStorageSync() {
        // Escuchar cambios de storage entre pestañas
        window.addEventListener('storage', (e) => {
            if (e.key === 'winzap_files') {
                this.files = JSON.parse(e.newValue) || [];
                this.loadFiles();
            }
            if (e.key === 'winzap_stats') {
                // Actualizar estadísticas si es necesario
            }
        });
    }

    notifyAdminPanel() {
        // Enviar evento personalizado para sincronización
        window.dispatchEvent(new CustomEvent('winzapStatsUpdated', {
            detail: {
                files: this.files,
                stats: JSON.parse(localStorage.getItem('winzap_stats'))
            }
        }));
    }

    closeDownloadModal() {
        const modal = document.getElementById('download-modal');
        const downloadBtn = document.getElementById('download-btn');
        const countdown = document.getElementById('countdown');
        
        modal.style.display = 'none';
        
        // Resetear estado del botón
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando descarga...';
        downloadBtn.onclick = null;
        countdown.textContent = '5';
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Estilos inline para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 10002;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }


    loadAdminFiles() {
        const adminFilesList = document.getElementById('admin-files-list');
        if (!adminFilesList) return;

        if (this.files.length === 0) {
            adminFilesList.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; opacity: 0.7;">
                        No hay archivos para gestionar
                    </td>
                </tr>
            `;
            return;
        }

        adminFilesList.innerHTML = this.files.map(file => `
            <tr>
                <td>${file.title}</td>
                <td>${file.downloads}</td>
                <td>${file.uploadDate}</td>
                <td>
                    <button class="action-btn" onclick="winzap.editFile(${file.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="action-btn delete" onclick="winzap.deleteFile(${file.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            </tr>
        `).join('');
    }

    editFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file) return;

        const newTitle = prompt('Nuevo título:', file.title);
        if (newTitle && newTitle !== file.title) {
            file.title = newTitle;
            this.saveFiles();
            this.loadFiles();
            this.loadAdminFiles();
            this.showMessage('Archivo actualizado', 'success');
        }
    }

    deleteFile(fileId) {
        if (confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
            this.files = this.files.filter(f => f.id !== fileId);
            this.stats.totalFiles = this.files.length;
            this.saveFiles();
            this.saveStats();
            this.updateStats();
            this.loadFiles();
            this.loadAdminFiles();
            this.showMessage('Archivo eliminado', 'success');
        }
    }

    updateStats() {
        this.stats.totalFiles = this.files.length;
        
        // Actualizar elementos del DOM
        const totalFilesEl = document.getElementById('total-files');
        const totalDownloadsEl = document.getElementById('total-downloads');
        const visitorsTodayEl = document.getElementById('visitors-today');
        
        if (totalFilesEl) totalFilesEl.textContent = this.stats.totalFiles;
        if (totalDownloadsEl) totalDownloadsEl.textContent = this.stats.totalDownloads;
        if (visitorsTodayEl) visitorsTodayEl.textContent = this.stats.visitorsToday;
    }

    trackVisitor() {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('winzap_last_visit');
        
        if (lastVisit !== today) {
            this.stats.visitorsToday++;
            localStorage.setItem('winzap_last_visit', today);
            this.saveStats();
        }
    }

    saveFiles() {
        localStorage.setItem('winzap_files', JSON.stringify(this.files));
    }

    saveStats() {
        localStorage.setItem('winzap_stats', JSON.stringify(this.stats));
    }

    showMessage(text, type = 'info') {
        // Crear elemento de mensaje
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${text}
        `;
        
        // Insertar al inicio del body
        document.body.insertBefore(message, document.body.firstChild);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }
}


// Funciones globales para navegación
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover clase active de todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar pestaña seleccionada
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activar botón correspondiente
    event.target.classList.add('active');
}

// Función global para cerrar modal
function closeDownloadModal() {
    if (window.winzap) {
        window.winzap.closeDownloadModal();
    }
}

// Función para actualizar contenido del sitio
function updateSiteContent(config) {
    // Actualizar título de la página
    document.title = config.siteTitle || 'WINZAP - Plataforma de archivos digitales';
    
    // Actualizar nombre del sitio en header
    const logoTitle = document.querySelector('.logo h1');
    if (logoTitle) {
        logoTitle.textContent = config.siteName || 'WINZAP';
    }
    
    // Actualizar título hero
    const heroTitle = document.querySelector('.hero h2');
    if (heroTitle) {
        heroTitle.textContent = config.heroTitle || 'Comparte y Descarga Archivos';
    }
    
    // Actualizar subtítulo hero
    const heroSubtitle = document.querySelector('.hero p');
    if (heroSubtitle) {
        heroSubtitle.textContent = config.heroSubtitle || 'La mejor plataforma para compartir tus archivos digitales de forma rápida y segura.';
    }
    
    // Actualizar título About
    const aboutTitle = document.querySelector('#about h2');
    if (aboutTitle) {
        aboutTitle.textContent = config.aboutTitle || 'Acerca de WINZAP';
    }
    
    // Actualizar descripción About
    const aboutDescription = document.querySelector('#about .about-content p');
    if (aboutDescription) {
        aboutDescription.textContent = config.aboutDescription || 'WINZAP es una plataforma innovadora diseñada para facilitar el intercambio de archivos digitales. Ofrecemos una experiencia segura y rápida para compartir contenido de alta calidad.';
    }
}

// Escuchar mensajes del panel admin
window.addEventListener('message', function(event) {
    if (event.data.type === 'updateSiteConfig') {
        updateSiteContent(event.data.config);
    }
});

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    window.winzap = new WinzapGamer();
    
    // Cargar configuración guardada
    const savedConfig = JSON.parse(localStorage.getItem('winzap_settings')) || {};
    if (Object.keys(savedConfig).length > 0) {
        updateSiteContent(savedConfig);
    }
});
