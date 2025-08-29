# 🚀 Guía de Despliegue - WINZAP GAMER

## Paso a Paso para Publicar en GitHub

### 1. Crear Repositorio en GitHub
1. Ve a [GitHub.com](https://github.com) e inicia sesión
2. Haz clic en "New repository" (botón verde)
3. Nombre del repositorio: `winzap-gamer`
4. Descripción: `Plataforma web para compartir archivos gaming`
5. Marca como **Público** (para GitHub Pages gratuito)
6. **NO** marques "Add a README file" (ya tenemos uno)
7. Haz clic en "Create repository"

### 2. Subir Archivos al Repositorio

Abre la terminal/PowerShell en la carpeta del proyecto y ejecuta:

```bash
# Inicializar repositorio Git
git init

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "🎮 Initial commit: WINZAP GAMER platform"

# Cambiar a rama main
git branch -M main

# Conectar con tu repositorio (CAMBIAR por tu usuario)
git remote add origin https://github.com/TU-USUARIO/winzap-gamer.git

# Subir archivos
git push -u origin main
```

### 3. Activar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Haz clic en **Settings** (pestaña superior)
3. Scroll hacia abajo hasta **Pages** (menú lateral izquierdo)
4. En **Source**, selecciona "Deploy from a branch"
5. En **Branch**, selecciona "main"
6. En **Folder**, deja "/ (root)"
7. Haz clic en **Save**

### 4. Tu Sitio Estará Disponible

- **URL**: `https://TU-USUARIO.github.io/winzap-gamer`
- Tarda 5-10 minutos en estar disponible
- GitHub te mostrará la URL exacta en la sección Pages

### 5. Dominio Personalizado (Opcional)

Si tienes un dominio propio:
1. Edita el archivo `CNAME` con tu dominio
2. Configura los DNS de tu dominio apuntando a GitHub Pages
3. En Settings > Pages, agrega tu dominio personalizado

## Comandos Útiles para Actualizaciones

```bash
# Para actualizar el sitio después de cambios
git add .
git commit -m "📝 Actualización: descripción del cambio"
git push

# Ver estado del repositorio
git status

# Ver historial de commits
git log --oneline
```

## Estructura Final del Proyecto

```
winzap-gamer/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── script.js           # JavaScript principal
├── ads.js             # Sistema de anuncios
├── server.js          # Servidor Node.js (opcional)
├── package.json       # Configuración npm
├── README.md          # Documentación
├── deploy.md          # Esta guía
├── .gitignore         # Archivos a ignorar
└── CNAME             # Dominio personalizado
```

## Notas Importantes

- **GitHub Pages es GRATUITO** para repositorios públicos
- Los cambios se reflejan automáticamente al hacer `git push`
- Solo funciona con archivos estáticos (HTML, CSS, JS)
- Para funcionalidad completa con backend, considera Netlify o Vercel

## Alternativas de Despliegue

### Netlify (Recomendado para funcionalidad completa)
1. Conecta tu repositorio de GitHub
2. Configuración automática
3. Soporte para backend y formularios
4. SSL gratuito

### Vercel
1. Importa desde GitHub
2. Despliegue automático
3. Excelente para aplicaciones JavaScript

¡Tu plataforma WINZAP GAMER estará lista para el mundo! 🌍🎮
