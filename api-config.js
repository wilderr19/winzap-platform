// Configuración de API para WINZAP
// Cambia la URL por la de tu VPS

class APIConfig {
    constructor() {
        // IMPORTANTE: Cambia esta URL por la de tu VPS
        this.baseURL = this.getBaseURL();
        this.endpoints = {
            files: '/api/files',
            upload: '/api/upload',
            download: '/api/download',
            stats: '/api/stats',
            visit: '/api/visit',
            health: '/api/health'
        };
    }

    getBaseURL() {
        // Detectar entorno
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        } else {
            // CAMBIAR POR TU DOMINIO VPS
            return 'https://tu-dominio.com'; // ← CAMBIAR AQUÍ
        }
    }

    getFullURL(endpoint) {
        return this.baseURL + endpoint;
    }

    // Método para hacer peticiones con manejo de errores
    async request(endpoint, options = {}) {
        const url = this.getFullURL(endpoint);
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Método específico para subir archivos
    async uploadFile(formData) {
        const url = this.getFullURL(this.endpoints.upload);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData // No establecer Content-Type para FormData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    }

    // Obtener archivos con filtros
    async getFiles(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);

        const endpoint = `${this.endpoints.files}?${params.toString()}`;
        return await this.request(endpoint);
    }

    // Obtener estadísticas
    async getStats() {
        return await this.request(this.endpoints.stats);
    }

    // Registrar visita
    async registerVisit() {
        return await this.request(this.endpoints.visit, { method: 'POST' });
    }

    // Verificar salud del servidor
    async checkHealth() {
        try {
            return await this.request(this.endpoints.health);
        } catch (error) {
            return { status: 'ERROR', error: error.message };
        }
    }

    // Obtener URL de descarga
    getDownloadURL(fileId) {
        return this.getFullURL(`${this.endpoints.download}/${fileId}`);
    }
}

// Crear instancia global
window.apiConfig = new APIConfig();

// Función de utilidad para mostrar notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 5000);
}

// Exportar para uso global
window.showNotification = showNotification;
