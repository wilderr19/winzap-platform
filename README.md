<<<<<<< HEAD
# 🎮 WINZAP GAMER

**La plataforma definitiva para compartir archivos gaming con monetización integrada**

## 📋 Descripción

WINZAP GAMER es una plataforma web moderna diseñada para que los gamers puedan subir, compartir y descargar archivos relacionados con videojuegos. La plataforma incluye un sistema de monetización por anuncios y un completo panel de administración.

## ✨ Características

### 🚀 Funcionalidades Principales
- **Subida de archivos** con imagen de portada, título y descripción
- **Sistema de búsqueda** para encontrar archivos fácilmente
- **Contador de descargas** y estadísticas en tiempo real
- **Panel de administración** completo para gestionar contenido
- **Diseño responsivo** optimizado para móviles y desktop
- **Monetización integrada** con espacios para anuncios

### 🎯 Tipos de Archivos Soportados
- Mods y modificaciones de juegos
- Texturas y skins personalizados
- Partidas guardadas (save games)
- Mapas y niveles personalizados
- Herramientas y utilidades gaming
- Videos y contenido multimedia

### 📊 Panel de Administración
- Estadísticas de descargas y visitantes
- Gestión completa de archivos (editar/eliminar)
- Configuración de anuncios
- Monitoreo de actividad

## 🛠️ Tecnologías Utilizadas

- **Frontend Público**: HTML5, CSS3, JavaScript (Vanilla)
- **Panel Admin**: HTML5, CSS3, JavaScript independiente
- **Backend**: Node.js + Express (opcional)
- **Almacenamiento**: LocalStorage (demo) / Base de datos (producción)
- **Estilos**: CSS Grid, Flexbox, Animaciones CSS
- **Iconos**: Font Awesome 6
- **Monetización**: Google AdSense (configurable)

## 🚀 Instalación y Uso

### Opción 1: Sitio Estático (GitHub Pages)
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/winzap-gamer.git
cd winzap-gamer

# Abrir index.html en tu navegador
# O usar un servidor local simple
python -m http.server 8000
# Luego ir a http://localhost:8000
```

### Opción 2: Con Backend (Node.js)
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## 📁 Estructura del Proyecto

```
winzap-gamer/
├── index.html          # Página pública para usuarios
├── admin.html          # Panel de administración separado
├── styles.css          # Estilos CSS compartidos
├── script.js           # JavaScript para página pública
├── admin.js            # JavaScript para panel admin
├── ads.js              # Sistema de anuncios
├── server.js           # Servidor Node.js (opcional)
├── package.json        # Configuración npm
├── README.md           # Este archivo
├── deploy.md           # Guía de despliegue
└── uploads/            # Carpeta para archivos subidos
```

## 🎨 Personalización

### Colores del Tema
```css
:root {
    --primary-color: #ff6b35;    /* Naranja principal */
    --secondary-color: #1a1a2e;  /* Azul oscuro */
    --accent-color: #16213e;     /* Azul acento */
    --bg-color: #0f0f23;        /* Fondo principal */
}
```

### Configurar Anuncios
1. Obtén tu código de Google AdSense
2. Ve al panel de administración
3. Ingresa tu ID de AdSense en configuración
4. Los anuncios se mostrarán automáticamente

## 📱 Características Responsivas

- **Desktop**: Layout completo con sidebar de anuncios
- **Tablet**: Adaptación de grid y navegación
- **Mobile**: Diseño optimizado para pantallas pequeñas

## 🔧 Configuración Avanzada

### Variables de Entorno (para backend)
```env
PORT=3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100MB
ADSENSE_ID=ca-pub-xxxxxxxxxx
```

### Límites de Archivos
- Tamaño máximo: 100MB por archivo
- Formatos soportados: Todos los tipos de archivo
- Imágenes de portada: JPG, PNG, GIF (máx. 5MB)

## 🚀 Despliegue en GitHub Pages

1. **Crear repositorio en GitHub**
2. **Subir archivos**:
```bash
git init
git add .
git commit -m "Initial commit: WINZAP GAMER platform"
git branch -M main
git remote add origin https://github.com/tu-usuario/winzap-gamer.git
git push -u origin main
```

3. **Activar GitHub Pages**:
   - Ve a Settings > Pages
   - Selecciona "Deploy from a branch"
   - Elige "main" branch
   - Tu sitio estará en: `https://tu-usuario.github.io/winzap-gamer`

## 📈 Monetización

### Google AdSense
- Espacios publicitarios estratégicamente ubicados
- Banner superior (728x90)
- Sidebar derecho (300x250)
- Banner inferior (728x90)
- Anuncios nativos entre contenido

### Métricas Incluidas
- Contador de visitantes diarios
- Estadísticas de descargas por archivo
- Total de archivos subidos
- Análisis de popularidad

## 🛡️ Seguridad

- Validación de tipos de archivo
- Límites de tamaño configurables
- Sanitización de nombres de archivo
- Protección contra uploads maliciosos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/winzap-gamer/issues)
- **Documentación**: [Wiki del proyecto](https://github.com/tu-usuario/winzap-gamer/wiki)
- **Email**: soporte@winzapgamer.com

## 🎯 Roadmap

- [ ] Sistema de usuarios y autenticación
- [ ] Comentarios y valoraciones
- [ ] Categorías y tags avanzados
- [ ] API REST completa
- [ ] Integración con servicios de almacenamiento en la nube
- [ ] Sistema de notificaciones
- [ ] Modo oscuro/claro
- [ ] PWA (Progressive Web App)

---

**¡Hecho con ❤️ para la comunidad gamer!**

*WINZAP GAMER - Donde los gamers comparten su pasión*
=======
# winzap-platform
WINZAP - Plataforma de archivos digitales
>>>>>>> 22cbbb1e4beb2846153509c43e326b94d9dbe762
