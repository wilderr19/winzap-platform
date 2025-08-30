# 🚀 Instalación Automática de WINZAP en VPS desde GitHub

## 🎯 Instalación en Una Línea

Conecta a tu VPS y ejecuta este comando:

```bash
curl -fsSL https://raw.githubusercontent.com/wilderr19/winzap-platform/main/deploy-from-github.sh | bash
```

¡Eso es todo! El script instalará automáticamente:
- Node.js y NPM
- PM2 para gestión de procesos
- Nginx como proxy reverso
- Tu aplicación WINZAP desde GitHub
- Configuración de firewall
- Scripts de backup y actualización

## 📋 Pasos Detallados

### 1. Conectar a tu VPS
```bash
ssh usuario@tu-ip-vps
```

### 2. Ejecutar instalación automática
```bash
# Opción 1: Instalación directa
curl -fsSL https://raw.githubusercontent.com/wilderr19/winzap-platform/main/deploy-from-github.sh | bash

# Opción 2: Descargar y revisar primero
wget https://raw.githubusercontent.com/wilderr19/winzap-platform/main/deploy-from-github.sh
chmod +x deploy-from-github.sh
./deploy-from-github.sh
```

### 3. Configurar tu dominio
Durante la instalación, el script te pedirá tu dominio:
```
Ingresa tu dominio (ejemplo: winzapgamer.com): tu-dominio.com
```

### 4. Configurar SSL (opcional pero recomendado)
```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## 🔧 Comandos Post-Instalación

### Gestión del servidor
```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs winzap-server

# Reiniciar servidor
pm2 restart winzap-server

# Parar servidor
pm2 stop winzap-server
```

### Actualizar desde GitHub
```bash
cd /var/www/winzap
./update-winzap.sh
```

### Crear backup
```bash
cd /var/www/winzap
./backup-winzap.sh
```

## 📱 Configurar Frontend

Después de la instalación, actualiza tu configuración frontend:

1. **Edita `api-config.js`** en tu repositorio GitHub:
```javascript
// Línea 18 - cambiar por tu dominio VPS
return 'https://tu-dominio.com';
```

2. **Haz commit y push** de los cambios:
```bash
git add api-config.js
git commit -m "Configurar API para VPS"
git push origin main
```

3. **Actualiza el servidor**:
```bash
cd /var/www/winzap
./update-winzap.sh
```

## 🌐 URLs de tu Instalación

Después de la instalación, tendrás acceso a:

- **Sitio principal**: `http://tu-dominio.com`
- **API de salud**: `http://tu-dominio.com/api/health`
- **Panel admin**: `http://tu-dominio.com/admin.html`
- **API de archivos**: `http://tu-dominio.com/api/files`

## 🔒 Configuración de Seguridad

### 1. Cambiar contraseña de admin
Edita `/var/www/winzap/vps-server.js`:
```javascript
adminPassword: 'tu-nueva-contraseña-segura'
```

### 2. Configurar CORS para tu dominio
Edita `/var/www/winzap/vps-server.js`:
```javascript
origin: ['https://wilderr19.github.io', 'https://tu-dominio.com'],
```

### 3. Reiniciar después de cambios
```bash
pm2 restart winzap-server
```

## 🚨 Solución de Problemas

### El servidor no inicia
```bash
# Verificar logs
pm2 logs winzap-server

# Verificar que el puerto 3000 esté libre
sudo netstat -tlnp | grep :3000

# Reiniciar PM2
pm2 kill
pm2 start vps-server.js --name winzap-server
```

### Error 502 Bad Gateway
```bash
# Verificar estado de la aplicación
pm2 status

# Verificar configuración de Nginx
sudo nginx -t

# Reiniciar servicios
pm2 restart winzap-server
sudo systemctl restart nginx
```

### Los archivos no se muestran
```bash
# Verificar permisos
sudo chown -R www-data:www-data /var/www/winzap/uploads/
sudo chmod -R 755 /var/www/winzap/uploads/

# Verificar que el directorio existe
ls -la /var/www/winzap/uploads/
```

## 📊 Monitoreo

### Ver estadísticas del servidor
```bash
# Uso de CPU y memoria
htop

# Espacio en disco
df -h

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Endpoint de monitoreo
Visita: `http://tu-dominio.com/api/health`

Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2024-08-29T...",
  "uptime": 3600,
  "files": 5
}
```

## 🔄 Actualizaciones Automáticas

El script crea un sistema de actualización automática:

```bash
# Actualizar manualmente
cd /var/www/winzap
./update-winzap.sh

# Configurar actualizaciones automáticas (opcional)
crontab -e
# Agregar: 0 3 * * * cd /var/www/winzap && ./update-winzap.sh
```

## 📦 Backups Automáticos

Los backups se crean automáticamente cada día a las 2 AM:
- Base de datos: `/var/www/winzap/backups/database_YYYYMMDD_HHMMSS.json`
- Metadatos: `/var/www/winzap/backups/uploads_metadata_YYYYMMDD_HHMMSS.tar.gz`

## 🎉 ¡Listo!

Tu servidor WINZAP estará funcionando y listo para recibir archivos de usuarios de todo el mundo. Los archivos subidos se mostrarán inmediatamente en tu página web.

### Flujo completo:
1. Usuario visita tu página web
2. Sube archivos a través del formulario
3. Archivos se almacenan en tu VPS
4. Se muestran inmediatamente a todos los visitantes
5. Otros usuarios pueden descargar los archivos

¡Tu plataforma de archivos está lista para el mundo! 🌍
