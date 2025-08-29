// WINZAP - Panel de Administración
class AdminPanel {
    constructor() {
        this.files = JSON.parse(localStorage.getItem('winzap_files')) || [];
        this.settings = JSON.parse(localStorage.getItem('winzap_settings')) || {
            adminPassword: 'admin123',
            adsenseCode: '',
            adsenseId: '',
            siteName: 'WINZAP',
            siteTitle: 'WINZAP - Plataforma de archivos digitales',
            heroTitle: 'Comparte y Descarga Archivos',
            heroSubtitle: 'La mejor plataforma para compartir tus archivos digitales de forma rápida y segura.',
            aboutTitle: 'Acerca de WINZAP',
            aboutDescription: 'WINZAP es una plataforma innovadora diseñada para facilitar el intercambio de archivos digitales. Ofrecemos una experiencia segura y rápida para compartir contenido de alta calidad.'
        };
        this.stats = JSON.parse(localStorage.getItem('winzap_stats')) || {
            totalFiles: 0,
            totalDownloads: 0,
            visitorsToday: 0
        };
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        // Admin upload form
        const adminUploadForm = document.getElementById('admin-upload-form');
        if (adminUploadForm) {
            adminUploadForm.addEventListener('submit', (e) => this.handleAdminUpload(e));
        }

        // File inputs
        const adminCoverImageInput = document.getElementById('admin-cover-image');
        if (adminCoverImageInput) {
            adminCoverImageInput.addEventListener('change', (e) => this.previewAdminImage(e));
        }

        const adminFileInput = document.getElementById('admin-file');
        if (adminFileInput) {
            adminFileInput.addEventListener('change', (e) => this.showAdminFileInfo(e));
        }

        // Search in manage tab
        const manageSearch = document.getElementById('manage-search');
        if (manageSearch) {
            manageSearch.addEventListener('input', (e) => this.searchAdminFiles(e.target.value));
        }

        // Enter key for login
        const passwordInput = document.getElementById('admin-password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    adminLogin();
                }
            });
        }
    }

    previewAdminImage(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('admin-image-preview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
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
                <div class="file-info-content">
                    <strong>Archivo:</strong> ${file.name}<br>
                    <strong>Tamaño:</strong> ${size}<br>
                    <strong>Tipo:</strong> ${type}
                </div>
            `;
        }
    }

    async handleAdminUpload(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const title = formData.get('title');
        const description = formData.get('description');
        const category = formData.get('category');
        const coverImage = formData.get('cover-image');
        const file = formData.get('file');

        if (!title || !description || !coverImage || !file) {
            this.showMessage('Por favor completa todos los campos', 'error');
            return;
        }

        this.showMessage('Subiendo archivo...', 'info');
        
        try {
            const coverImageBase64 = await this.fileToBase64(coverImage);
            
            const newFile = {
                id: Date.now(),
                title: title.trim(),
                description: description.trim(),
                category: category,
                coverImage: coverImageBase64,
                fileName: file.name,
                fileSize: this.formatFileSize(file.size),
                fileType: file.type,
                uploadDate: new Date().toLocaleDateString('es-ES'),
                downloads: 0,
                publishedAt: new Date().toISOString()
            };

            this.files.push(newFile);
            this.saveFiles();
            this.updateStats();
            this.loadAdminFiles();
            
            // Limpiar formulario
            event.target.reset();
            document.getElementById('admin-image-preview').innerHTML = '';
            document.getElementById('admin-file-info').innerHTML = '';
            
            this.showMessage('¡Archivo publicado exitosamente!', 'success');
            
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    loadAdminFiles() {
        const adminFilesList = document.getElementById('admin-files-list');
        if (!adminFilesList) return;

        if (this.files.length === 0) {
            adminFilesList.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; opacity: 0.7;">
                        <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        No hay archivos publicados aún
                    </td>
                </tr>
            `;
            return;
        }

        adminFilesList.innerHTML = this.files.map(file => `
            <tr>
                <td>
                    <img src="${file.coverImage}" alt="${file.title}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                </td>
                <td>
                    <strong>${file.title}</strong><br>
                    <small style="opacity: 0.7;">${file.fileName}</small>
                </td>
                <td>
                    <span class="category-badge category-${file.category}">${file.category}</span>
                </td>
                <td>
                    <i class="fas fa-download"></i> ${file.downloads}
                </td>
                <td>${file.uploadDate}</td>
                <td>
                    <button class="action-btn edit" onclick="adminPanel.editFile(${file.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="adminPanel.deleteFile(${file.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    searchAdminFiles(query) {
        const filteredFiles = this.files.filter(file => 
            file.title.toLowerCase().includes(query.toLowerCase()) ||
            file.description.toLowerCase().includes(query.toLowerCase()) ||
            file.category.toLowerCase().includes(query.toLowerCase())
        );
        
        const adminFilesList = document.getElementById('admin-files-list');
        if (!adminFilesList) return;

        if (filteredFiles.length === 0 && query) {
            adminFilesList.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; opacity: 0.7;">
                        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        No se encontraron archivos para "${query}"
                    </td>
                </tr>
            `;
            return;
        }

        if (query === '') {
            this.loadAdminFiles();
            return;
        }

        adminFilesList.innerHTML = filteredFiles.map(file => `
            <tr>
                <td>
                    <img src="${file.coverImage}" alt="${file.title}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                </td>
                <td>
                    <strong>${file.title}</strong><br>
                    <small style="opacity: 0.7;">${file.fileName}</small>
                </td>
                <td>
                    <span class="category-badge category-${file.category}">${file.category}</span>
                </td>
                <td>
                    <i class="fas fa-download"></i> ${file.downloads}
                </td>
                <td>${file.uploadDate}</td>
                <td>
                    <button class="action-btn edit" onclick="adminPanel.editFile(${file.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="adminPanel.deleteFile(${file.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
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
            this.loadAdminFiles();
            this.showMessage('Archivo actualizado', 'success');
        }
    }

    deleteFile(fileId) {
        if (confirm('¿Estás seguro de que quieres eliminar este archivo? Esta acción no se puede deshacer.')) {
            this.files = this.files.filter(f => f.id !== fileId);
            this.stats.totalFiles = this.files.length;
            this.saveFiles();
            this.saveStats();
            this.updateStats();
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
        const adViewsEl = document.getElementById('ad-views');
        
        if (totalFilesEl) totalFilesEl.textContent = this.stats.totalFiles;
        if (totalDownloadsEl) totalDownloadsEl.textContent = this.stats.totalDownloads;
        if (visitorsTodayEl) visitorsTodayEl.textContent = this.stats.visitorsToday;
        
        // Calcular vistas de anuncios
        const adViews = JSON.parse(localStorage.getItem('winzap_ad_views')) || [];
        if (adViewsEl) adViewsEl.textContent = adViews.length;
    }

    saveFiles() {
        localStorage.setItem('winzap_files', JSON.stringify(this.files));
    }

    saveStats() {
        localStorage.setItem('winzap_stats', JSON.stringify(this.stats));
    }

    saveSettings() {
        localStorage.setItem('winzap_settings', JSON.stringify(this.settings));
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        // Event listeners para el admin
        const uploadForm = document.getElementById('upload-form');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.uploadFile();
            });
        }

        // Event listener para búsqueda
        const searchInput = document.getElementById('admin-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchAdminFiles(e.target.value);
            });
        }

        // Event listener para categoría personalizada
        const categorySelect = document.getElementById('file-category');
        const customCategoryInput = document.getElementById('custom-category');
        
        if (categorySelect && customCategoryInput) {
            categorySelect.addEventListener('change', () => {
                if (categorySelect.value === 'personalizada') {
                    customCategoryInput.style.display = 'block';
                    customCategoryInput.required = true;
                } else {
                    customCategoryInput.style.display = 'none';
                    customCategoryInput.required = false;
                    customCategoryInput.value = '';
                }
            });
        }
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `admin-message ${type}`;
        message.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${text}
        `;
        
        document.body.insertBefore(message, document.body.firstChild);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }
}

// Funciones globales para el admin
function toggleCustomCategory() {
    const categorySelect = document.getElementById('admin-category');
    const customCategoryInput = document.getElementById('admin-custom-category');
    
    if (categorySelect && customCategoryInput) {
        const category = categorySelect.value === 'personalizada' ? 
            (customCategoryInput.value.trim() || 'personalizada') : categorySelect.value;
        if (categorySelect.value === 'personalizada') {
            customCategoryInput.style.display = 'block';
            customCategoryInput.required = true;
        } else {
            customCategoryInput.style.display = 'none';
            customCategoryInput.required = false;
            customCategoryInput.value = '';
        }
    }
}

function adminLogin() {
    const password = document.getElementById('admin-password').value;
    const correctPassword = adminPanel.settings.adminPassword;
    
    if (password === correctPassword) {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        adminPanel.isLoggedIn = true;
        adminPanel.loadAdminFiles();
        adminPanel.loadSiteConfig();
        adminPanel.showMessage('¡Acceso administrativo concedido!', 'success');
    } else {
        adminPanel.showMessage('Contraseña incorrecta', 'error');
    }
    document.getElementById('admin-password').value = '';
}

function adminLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        document.getElementById('admin-login').style.display = 'block';
        document.getElementById('admin-dashboard').style.display = 'none';
        adminPanel.isLoggedIn = false;
        document.getElementById('admin-password').value = '';
        adminPanel.showMessage('Sesión cerrada', 'info');
    }
}

function showAdminTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
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
    
    // Cargar contenido específico de la pestaña
    if (tabName === 'manage') {
        adminPanel.loadAdminFiles();
    } else if (tabName === 'analytics') {
        loadAnalytics();
    }
}

function refreshFilesList() {
    adminPanel.loadAdminFiles();
    adminPanel.showMessage('Lista actualizada', 'success');
}

function saveAdSettings() {
    const adsenseId = document.getElementById('adsense-id').value;
    adminPanel.settings.adsenseId = adsenseId;
    adminPanel.saveSettings();
    adminPanel.showMessage('Configuración de anuncios guardada', 'success');
}

function saveSiteSettings() {
    const siteTitle = document.getElementById('site-title').value;
    const siteDescription = document.getElementById('site-description').value;
    
    adminPanel.settings.siteTitle = siteTitle;
    adminPanel.settings.siteDescription = siteDescription;
    adminPanel.saveSettings();
    adminPanel.showMessage('Configuración del sitio guardada', 'success');
}

function loadAnalytics() {
    // Cargar archivos más populares
    const popularFilesList = document.getElementById('popular-files-list');
    if (popularFilesList) {
        const sortedFiles = [...adminPanel.files].sort((a, b) => b.downloads - a.downloads).slice(0, 5);
        
        if (sortedFiles.length === 0) {
            popularFilesList.innerHTML = '<p style="opacity: 0.7;">No hay datos disponibles</p>';
            return;
        }
        
        popularFilesList.innerHTML = sortedFiles.map((file, index) => `
            <div class="popular-item">
                <span class="rank">#${index + 1}</span>
                <img src="${file.coverImage}" alt="${file.title}">
                <div class="popular-info">
                    <strong>${file.title}</strong>
                    <span>${file.downloads} descargas</span>
                </div>
            </div>
        `).join('');
    }
}

// Inicializar panel de administración
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
