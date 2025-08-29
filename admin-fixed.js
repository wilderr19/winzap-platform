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
        this.setupRealTimeSync();
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

    setupRealTimeSync() {
        // Escuchar eventos de actualización desde el sitio público
        window.addEventListener('winzapStatsUpdated', (event) => {
            this.files = event.detail.files;
            this.stats = event.detail.stats;
            this.updateStats();
            this.loadAdminFiles();
        });

        // Verificar cambios en localStorage cada segundo
        setInterval(() => {
            const currentFiles = JSON.parse(localStorage.getItem('winzap_files')) || [];
            const currentStats = JSON.parse(localStorage.getItem('winzap_stats')) || this.stats;
            
            if (JSON.stringify(currentFiles) !== JSON.stringify(this.files) || 
                JSON.stringify(currentStats) !== JSON.stringify(this.stats)) {
                this.files = currentFiles;
                this.stats = currentStats;
                this.updateStats();
                this.loadAdminFiles();
            }
        }, 1000);

        // Escuchar cambios de storage entre pestañas
        window.addEventListener('storage', (e) => {
            if (e.key === 'winzap_files' || e.key === 'winzap_stats') {
                this.files = JSON.parse(localStorage.getItem('winzap_files')) || [];
                this.stats = JSON.parse(localStorage.getItem('winzap_stats')) || this.stats;
                this.updateStats();
                this.loadAdminFiles();
            }
        });
    }

    uploadFile() {
        const title = document.getElementById('file-title').value;
        const description = document.getElementById('file-description').value;
        const category = document.getElementById('file-category').value;
        const customCategory = document.getElementById('custom-category').value;
        const fileInput = document.getElementById('file-upload');
        const imageInput = document.getElementById('file-image');

        if (!title || !description || !category) {
            this.showMessage('Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        if (category === 'personalizada' && !customCategory) {
            this.showMessage('Por favor ingresa el nombre de la categoría personalizada', 'error');
            return;
        }

        const finalCategory = category === 'personalizada' ? customCategory.toLowerCase().replace(/\s+/g, '-') : category;

        const newFile = {
            id: Date.now(),
            title: title,
            description: description,
            category: finalCategory,
            fileName: fileInput.files[0] ? fileInput.files[0].name : `${title}.file`,
            fileSize: fileInput.files[0] ? this.formatFileSize(fileInput.files[0].size) : '1.0 MB',
            downloads: 0,
            uploadDate: new Date().toLocaleDateString('es-ES'),
            fileUrl: fileInput.files[0] ? URL.createObjectURL(fileInput.files[0]) : null
        };

        // Procesar imagen
        if (imageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                newFile.coverImage = e.target.result;
                this.addFileToList(newFile);
            };
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            newFile.coverImage = this.getDefaultImage(finalCategory);
            this.addFileToList(newFile);
        }
    }

    addFileToList(file) {
        this.files.push(file);
        this.stats.totalFiles = this.files.length;
        this.saveFiles();
        this.saveStats();
        this.updateStats();
        this.loadAdminFiles();
        this.showMessage('Archivo subido exitosamente', 'success');
        
        // Notificar a otras pestañas del cambio
        this.notifyOtherTabs();
        
        // Limpiar formulario
        document.getElementById('upload-form').reset();
        document.getElementById('custom-category').style.display = 'none';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getDefaultImage(category) {
        const defaultImages = {
            'http-custom': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzNiODJmNjtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMxZDRlZDg7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjZ3JhZDEpIi8+PC9zdmc+',
            'zivpn': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzEwYjk4MTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwNTk2Njk7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjZ3JhZDIpIi8+PC9zdmc+'
        };
        return defaultImages[category] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM2Mzc0OGYiLz48L3N2Zz4=';
    }

    loadAdminFiles() {
        const adminFilesList = document.getElementById('admin-files-list');
        if (!adminFilesList) return;

        if (this.files.length === 0) {
            adminFilesList.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; opacity: 0.7;">
                        <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        No hay archivos subidos aún
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
        if (file) {
            // Implementar edición de archivo
            this.showMessage('Función de edición en desarrollo', 'info');
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
            
            // Notificar a otras pestañas del cambio
            this.notifyOtherTabs();
        }
    }

    notifyOtherTabs() {
        // Disparar evento storage manualmente para sincronizar entre pestañas
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'winzap_files',
            newValue: JSON.stringify(this.files),
            storageArea: localStorage
        }));
        
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'winzap_stats', 
            newValue: JSON.stringify(this.stats),
            storageArea: localStorage
        }));
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

    saveSiteConfig() {
        const siteName = document.getElementById('site-name').value;
        const siteTitle = document.getElementById('site-title').value;
        const heroTitle = document.getElementById('hero-title').value;
        const heroSubtitle = document.getElementById('hero-subtitle').value;
        const aboutTitle = document.getElementById('about-title').value;
        const aboutDescription = document.getElementById('about-description').value;
        
        this.settings.siteName = siteName;
        this.settings.siteTitle = siteTitle;
        this.settings.heroTitle = heroTitle;
        this.settings.heroSubtitle = heroSubtitle;
        this.settings.aboutTitle = aboutTitle;
        this.settings.aboutDescription = aboutDescription;
        
        this.saveSettings();
        this.showMessage('Configuración del sitio guardada exitosamente', 'success');
        
        // Actualizar el sitio público inmediatamente
        this.updatePublicSite();
    }

    updatePublicSite() {
        // Enviar mensaje a la ventana principal si está abierta
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage({
                    type: 'updateSiteConfig',
                    config: this.settings
                }, '*');
            }
        } catch (e) {
            console.log('No se pudo comunicar con la ventana principal');
        }
    }

    loadSiteConfig() {
        if (document.getElementById('site-name')) {
            document.getElementById('site-name').value = this.settings.siteName || 'WINZAP';
            document.getElementById('site-title').value = this.settings.siteTitle || 'WINZAP - Plataforma de archivos digitales';
            document.getElementById('hero-title').value = this.settings.heroTitle || 'Comparte y Descarga Archivos';
            document.getElementById('hero-subtitle').value = this.settings.heroSubtitle || 'La mejor plataforma para compartir tus archivos digitales de forma rápida y segura.';
            document.getElementById('about-title').value = this.settings.aboutTitle || 'Acerca de WINZAP';
            document.getElementById('about-description').value = this.settings.aboutDescription || 'WINZAP es una plataforma innovadora diseñada para facilitar el intercambio de archivos digitales. Ofrecemos una experiencia segura y rápida para compartir contenido de alta calidad.';
        }
    }

    changePassword() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!newPassword || !confirmPassword) {
            this.showMessage('Por favor completa todos los campos', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showMessage('Las contraseñas no coinciden', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        this.settings.adminPassword = newPassword;
        this.saveSettings();
        
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        
        this.showMessage('Contraseña cambiada exitosamente', 'success');
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
            message.style.opacity = '0';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 3000);
    }
}

// Funciones globales
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
    const tabs = document.querySelectorAll('.admin-tab-content');
    tabs.forEach(tab => tab.style.display = 'none');
    
    // Mostrar la pestaña seleccionada
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Actualizar botones de navegación
    const navButtons = document.querySelectorAll('.admin-nav button');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    const activeButton = document.querySelector(`[onclick="showAdminTab('${tabName}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Inicializar panel de administración
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
