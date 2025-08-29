// Sistema de Anuncios para WINZAP GAMER
class AdManager {
    constructor() {
        this.adsenseId = localStorage.getItem('winzap_adsense_id') || '';
        this.adConfig = {
            banner: { width: 728, height: 90, slot: 'banner-slot' },
            sidebar: { width: 300, height: 250, slot: 'sidebar-slot' },
            bottom: { width: 728, height: 90, slot: 'bottom-slot' }
        };
        this.init();
    }

    init() {
        this.loadGoogleAdsense();
        this.setupAdPlaceholders();
        this.trackAdViews();
    }

    loadGoogleAdsense() {
        if (this.adsenseId) {
            // Cargar script de Google AdSense
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adsenseId}`;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
            
            // Inicializar AdSense
            window.adsbygoogle = window.adsbygoogle || [];
        }
    }

    setupAdPlaceholders() {
        // Banner superior
        this.createAdUnit('ad-banner', 'banner');
        
        // Sidebar derecho
        this.createAdUnit('side-ad', 'sidebar');
        
        // Banner inferior
        this.createAdUnit('bottom-ad', 'bottom');
    }

    createAdUnit(containerId, type) {
        const container = document.querySelector(`.${containerId}`);
        if (!container) return;

        const placeholder = container.querySelector('.ad-placeholder');
        if (!placeholder) return;

        if (this.adsenseId) {
            // Crear anuncio real de AdSense
            const adConfig = this.adConfig[type];
            placeholder.innerHTML = `
                <ins class="adsbygoogle"
                     style="display:inline-block;width:${adConfig.width}px;height:${adConfig.height}px"
                     data-ad-client="${this.adsenseId}"
                     data-ad-slot="${adConfig.slot}">
                </ins>
            `;
            
            // Activar anuncio
            if (window.adsbygoogle) {
                window.adsbygoogle.push({});
            }
        } else {
            // Mostrar anuncio demo/placeholder
            this.createDemoAd(placeholder, type);
        }
    }

    createDemoAd(placeholder, type) {
        const adConfig = this.adConfig[type];
        const demoAds = {
            banner: [
                { text: '🎮 Ofertas Gaming - 50% OFF', color: '#ff6b35', link: '#' },
                { text: '🕹️ Nuevos Juegos Disponibles', color: '#4caf50', link: '#' },
                { text: '⚡ Hardware Gaming Premium', color: '#2196f3', link: '#' }
            ],
            sidebar: [
                { text: '🎯 Accesorios Gaming\nMouse, Teclados, Headsets', color: '#9c27b0', link: '#' },
                { text: '🏆 Torneos Online\n¡Participa y Gana!', color: '#ff5722', link: '#' },
                { text: '💻 PC Gaming Setup\nArma tu PC ideal', color: '#607d8b', link: '#' }
            ],
            bottom: [
                { text: '🎪 Streaming Gaming - Mejores Herramientas', color: '#e91e63', link: '#' },
                { text: '🎨 Diseño Gaming - Logos y Overlays', color: '#795548', link: '#' },
                { text: '📱 Apps Gaming - Descarga Gratis', color: '#009688', link: '#' }
            ]
        };

        const ads = demoAds[type];
        const randomAd = ads[Math.floor(Math.random() * ads.length)];
        
        placeholder.innerHTML = `
            <div class="demo-ad" style="
                background: linear-gradient(135deg, ${randomAd.color}, ${this.lightenColor(randomAd.color, 20)});
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                cursor: pointer;
                transition: transform 0.3s ease;
                width: ${adConfig.width}px;
                height: ${adConfig.height}px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            " onclick="this.style.transform='scale(0.95)'; setTimeout(() => this.style.transform='scale(1)', 150);">
                <div>
                    <div style="font-size: ${type === 'sidebar' ? '16px' : '18px'}; margin-bottom: 5px;">
                        ${randomAd.text.split('\\n')[0]}
                    </div>
                    ${randomAd.text.includes('\\n') ? `<div style="font-size: 14px; opacity: 0.9;">${randomAd.text.split('\\n')[1]}</div>` : ''}
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">
                        Anuncio Demo - Configura AdSense
                    </div>
                </div>
            </div>
        `;
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    trackAdViews() {
        // Simular tracking de visualizaciones de anuncios
        const adElements = document.querySelectorAll('.demo-ad, .adsbygoogle');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.logAdView(entry.target);
                }
            });
        }, { threshold: 0.5 });

        adElements.forEach(ad => observer.observe(ad));
    }

    logAdView(adElement) {
        // Registrar visualización de anuncio
        const adViews = JSON.parse(localStorage.getItem('winzap_ad_views')) || [];
        adViews.push({
            timestamp: new Date().toISOString(),
            type: adElement.className.includes('demo-ad') ? 'demo' : 'adsense'
        });
        
        // Mantener solo las últimas 100 visualizaciones
        if (adViews.length > 100) {
            adViews.splice(0, adViews.length - 100);
        }
        
        localStorage.setItem('winzap_ad_views', JSON.stringify(adViews));
    }

    updateAdsenseId(newId) {
        this.adsenseId = newId;
        localStorage.setItem('winzap_adsense_id', newId);
        
        // Recargar anuncios con nueva configuración
        this.init();
        
        return true;
    }

    getAdStats() {
        const adViews = JSON.parse(localStorage.getItem('winzap_ad_views')) || [];
        const today = new Date().toDateString();
        
        const todayViews = adViews.filter(view => 
            new Date(view.timestamp).toDateString() === today
        );

        return {
            totalViews: adViews.length,
            todayViews: todayViews.length,
            adsenseConfigured: !!this.adsenseId,
            lastView: adViews.length > 0 ? adViews[adViews.length - 1].timestamp : null
        };
    }
}

// Inicializar sistema de anuncios
let adManager;
document.addEventListener('DOMContentLoaded', () => {
    adManager = new AdManager();
});

// Función global para configurar AdSense desde el panel admin
function configureAdsense(adsenseId) {
    if (adManager) {
        adManager.updateAdsenseId(adsenseId);
        return true;
    }
    return false;
}
