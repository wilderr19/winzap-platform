// WINZAP - Panel de Administración Completo
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
        this.loadAdminFiles();
    }

    setupEventListeners() {
        // Admin upload form
        const adminUploadForm = document.getElementById('admin-upload-form');
        if (adminUploadForm) {
            adminUploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.uploadFile();
            });
        }

        // Event listener para vista previa de imagen
        const imageInput = document.getElementById('admin-cover-image');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.previewImage(e));
        }

        // Event listener para información de archivo
        const fileInput = document.getElementById('admin-file');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.showFileInfo(e));
        }

        // Event listener para categoría personalizada
        const categorySelect = document.getElementById('admin-category');
        const customCategoryInput = document.getElementById('custom-category');
        
        if (categorySelect && customCategoryInput) {
            categorySelect.addEventListener('change', () => {
                if (categorySelect.value === 'personalizada') {
                    customCategoryInput.style.display = 'block';
                    customCategoryInput.required = true;
                } else {
                    customCategoryInput.style.display = 'none';
                    customCategoryInput.required = false;
                }
            });
        }

        // Event listener para búsqueda
        const searchInput = document.getElementById('admin-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchAdminFiles(e.target.value);
            });
        }
    }

    setupRealTimeSync() {
        // Escuchar cambios de storage entre pestañas
        window.addEventListener('storage', (e) => {
            if (e.key === 'winzap_files') {
                const newFiles = JSON.parse(e.newValue) || [];
                if (JSON.stringify(newFiles) !== JSON.stringify(this.files)) {
                    this.files = newFiles;
                    this.loadAdminFiles();
                }
            }
            if (e.key === 'winzap_stats') {
                const newStats = JSON.parse(e.newValue) || this.stats;
                if (JSON.stringify(newStats) !== JSON.stringify(this.stats)) {
                    this.stats = newStats;
                    this.updateStats();
                }
            }
        });
    }

    uploadFile() {
        const title = document.getElementById('admin-title').value;
        const description = document.getElementById('admin-description').value;
        const category = document.getElementById('admin-category').value;
        const customCategory = document.getElementById('custom-category').value;
        const fileInput = document.getElementById('admin-file');
        const imageInput = document.getElementById('admin-cover-image');

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
            uploadDate: new Date().toLocaleDateString('es-ES')
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
        
        // Guardar directamente en localStorage
        localStorage.setItem('winzap_files', JSON.stringify(this.files));
        localStorage.setItem('winzap_stats', JSON.stringify(this.stats));
        
        this.updateStats();
        this.loadAdminFiles();
        this.showMessage('Archivo subido exitosamente', 'success');
        
        // Notificar a otras pestañas del cambio
        this.notifyOtherTabs();
        
        // Limpiar formulario
        document.getElementById('admin-upload-form').reset();
        const customCategoryDiv = document.getElementById('custom-category');
        if (customCategoryDiv) {
            customCategoryDiv.style.display = 'none';
        }
        
        // Limpiar vista previa
        const preview = document.getElementById('admin-image-preview');
        if (preview) {
            preview.innerHTML = '';
        }
        const fileInfo = document.getElementById('admin-file-info');
        if (fileInfo) {
            fileInfo.innerHTML = '';
        }
    }

    getDefaultImage(category) {
        const defaultImages = {
            'http-custom': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%234CAF50'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-size='18'%3EHTTP CUSTOM%3C/text%3E%3C/svg%3E",
            'zivpn': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23FF5722'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-size='18'%3EZiVPN%3C/text%3E%3C/svg%3E",
            'npv-tunnel': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23E91E63'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-size='16'%3ENPV TUNNEL%3C/text%3E%3C/svg%3E"
        };
        return defaultImages[category] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23666'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-size='18'%3EARCHIVO%3C/text%3E%3C/svg%3E";
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    previewImage(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('admin-image-preview');
        
        if (file && preview) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #4CAF50;">`;
            };
            reader.readAsDataURL(file);
        }
    }

    showFileInfo(event) {
        const file = event.target.files[0];
        const fileInfo = document.getElementById('admin-file-info');
        
        if (file && fileInfo) {
            const size = this.formatFileSize(file.size);
            fileInfo.innerHTML = `
                <div style="background: #333; padding: 10px; border-radius: 5px; margin-top: 10px; border: 1px solid #4CAF50;">
                    <strong>📄 Archivo seleccionado:</strong><br>
                    <span style="color: #4CAF50;">${file.name}</span><br>
                    <strong>📊 Tamaño:</strong> ${size}
                </div>
            `;
        }
    }

    loadAdminFiles() {
        this.displayAdminFiles();
    }

    displayAdminFiles(filesToShow = this.files) {
        const adminFilesList = document.getElementById('admin-files-list');
        if (!adminFilesList) return;

        if (filesToShow.length === 0) {
            adminFilesList.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; opacity: 0.7;">
                        <i class="fas fa-folder-open fa-2x"></i><br>
                        No hay archivos para mostrar
                    </td>
                </tr>
            `;
            return;
        }

        adminFilesList.innerHTML = filesToShow.map(file => `
            <tr>
                <td>
                    <img src="${file.coverImage || file.image}" alt="${file.title}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                </td>
                <td><strong>${file.title}</strong></td>
                <td><span class="category-badge">${this.getCategoryName(file.category)}</span></td>
                <td><i class="fas fa-download"></i> ${file.downloads || 0}</td>
                <td>${file.uploadDate || new Date().toLocaleDateString()}</td>
                <td>
                    <button onclick="adminPanel.editFile(${file.id})" class="btn-edit" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="adminPanel.deleteFile(${file.id})" class="btn-delete" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getCategoryName(category) {
        const categoryNames = {
            'http-custom': 'HTTP CUSTOM',
            'zivpn': 'ZIVPN',
            'npv-tunnel': 'NPV TUNNEL',
            'nexprime': 'NEXPRIME',
            'http-injector': 'HTTP INJECTOR',
            'acm-custom-socksip': 'ACM CUSTOM SOCKSIP',
            'documentos': 'Documentos',
            'software': 'Software',
            'multimedia': 'Multimedia',
            'recursos': 'Recursos'
        };
        return categoryNames[category] || category.toUpperCase();
    }

    searchAdminFiles(query) {
        const filteredFiles = this.files.filter(file => 
            file.title.toLowerCase().includes(query.toLowerCase()) ||
            file.description.toLowerCase().includes(query.toLowerCase()) ||
            file.category.toLowerCase().includes(query.toLowerCase())
        );
        this.displayAdminFiles(filteredFiles);
    }

    editFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (file) {
            this.showMessage('Función de edición en desarrollo', 'info');
        }
    }

    deleteFile(fileId) {
        if (confirm('¿Estás seguro de que quieres eliminar este archivo? Esta acción no se puede deshacer.')) {
            this.files = this.files.filter(f => f.id !== fileId);
            this.stats.totalFiles = this.files.length;
            
            localStorage.setItem('winzap_files', JSON.stringify(this.files));
            localStorage.setItem('winzap_stats', JSON.stringify(this.stats));
            
            this.updateStats();
            this.loadAdminFiles();
            this.showMessage('Archivo eliminado', 'success');
            
            this.notifyOtherTabs();
        }
    }

    notifyOtherTabs() {
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
        
        const totalFilesEl = document.getElementById('total-files');
        const totalDownloadsEl = document.getElementById('total-downloads');
        const visitorsTodayEl = document.getElementById('visitors-today');
        
        if (totalFilesEl) totalFilesEl.textContent = this.stats.totalFiles;
        if (totalDownloadsEl) totalDownloadsEl.textContent = this.stats.totalDownloads || 0;
        if (visitorsTodayEl) visitorsTodayEl.textContent = this.stats.visitorsToday || 0;
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            ${type === 'success' ? 'background: #4CAF50;' : type === 'error' ? 'background: #f44336;' : 'background: #2196F3;'}
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
}

// Función global para login
function adminLogin() {
    const password = document.getElementById('admin-password').value;
    const settings = JSON.parse(localStorage.getItem('winzap_settings')) || { adminPassword: 'admin123' };
    
    if (password === settings.adminPassword) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        
        // Mostrar mensaje de éxito
        const messageDiv = document.createElement('div');
        messageDiv.textContent = 'Acceso concedido';
        messageDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 20px;
            border-radius: 5px; color: white; font-weight: bold; z-index: 10000;
            background: #4CAF50;
        `;
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 2000);
        
    } else {
        // Mostrar mensaje de error
        const messageDiv = document.createElement('div');
        messageDiv.textContent = 'Contraseña incorrecta';
        messageDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 20px;
            border-radius: 5px; color: white; font-weight: bold; z-index: 10000;
            background: #f44336;
        `;
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
        
        document.getElementById('admin-password').value = '';
    }
}

// Función para mostrar tabs
function showAdminTab(tabName) {
    // Ocultar todas las tabs
    const tabs = document.querySelectorAll('.admin-tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Mostrar tab seleccionada
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Actualizar botones
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeButton = document.querySelector(`[onclick="showAdminTab('${tabName}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Inicializar panel admin
const adminPanel = new AdminPanel();
