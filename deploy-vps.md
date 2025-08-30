# 🚀 Guía de Despliegue VPS para WINZAP

## 📋 Requisitos Previos

- VPS con Ubuntu 20.04+ o Debian 11+
- Dominio configurado apuntando a tu VPS
- Acceso SSH a tu VPS
- Al menos 2GB RAM y 20GB de almacenamiento

## 🛠️ Pasos de Instalación

### 1. Conectar a tu VPS
```bash
ssh root@tu-ip-vps
# o
ssh usuario@tu-ip-vps
```

### 2. Ejecutar script de configuración
```bash
# Subir el archivo vps-setup.sh a tu VPS
scp vps-setup.sh usuario@tu-ip-vps:/home/usuario/

# Conectar y ejecutar
ssh usuario@tu-ip-vps
chmod +x vps-setup.sh
./vps-setup.sh
```

### 3. Subir archivos del proyecto
```bash
# Desde tu computadora local
scp -r * usuario@tu-ip-vps:/var/www/winzap/
```

### 4. Instalar dependencias
```bash
# En tu VPS
cd /var/www/winzap
cp package-vps.json package.json
npm install
```

### 5. Configurar dominio
```bash
# Editar configuración de Nginx
sudo nano /etc/nginx/sites-available/winzap

# Cambiar "tu-dominio.com" por tu dominio real
# Ejemplo: winzapgamer.com
```

### 6. Configurar SSL
```bash
# Instalar certificado SSL gratuito
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

### 7. Iniciar aplicación
```bash
# Iniciar con PM2
pm2 start vps-server.js --name winzap-server

# Guardar configuración PM2
pm2 save
pm2 startup
```

## ⚙️ Configuración del Frontend

### 1. Actualizar API Config
Edita el archivo `api-config.js` y cambia:
```javascript
// Línea 18 - cambiar por tu dominio
return 'https://tu-dominio.com'; // ← CAMBIAR AQUÍ
```

### 2. Actualizar CORS en servidor
Edita `vps-server.js` línea 32:
```javascript
origin: ['https://winzapgamer.github.io', 'http://localhost:3000', 'https://tu-dominio.com'],
```

## 🔧 Comandos Útiles

### Gestión del servidor
```bash
# Ver logs
pm2 logs winzap-server

# Reiniciar servidor
pm2 restart winzap-server

# Parar servidor
pm2 stop winzap-server

# Ver estado
pm2 status
```

### Gestión de archivos
```bash
# Ver archivos subidos
ls -la /var/www/winzap/uploads/

# Ver base de datos
cat /var/www/winzap/winzap-database.json

# Backup de base de datos
cp /var/www/winzap/winzap-database.json /var/www/winzap/backup-$(date +%Y%m%d).json
```

### Nginx
```bash
# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

## 🔒 Seguridad

### 1. Cambiar contraseña de admin
Edita `vps-server.js` línea 67:
```javascript
adminPassword: 'tu-nueva-contraseña-segura'
```

### 2. Configurar firewall
```bash
sudo ufw status
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. Actualizar sistema regularmente
```bash
sudo apt update && sudo apt upgrade -y
```

## 📊 Monitoreo

### Ver estadísticas en tiempo real
```bash
# CPU y memoria
htop

# Espacio en disco
df -h

# Logs de aplicación
pm2 logs winzap-server --lines 50
```

### Endpoint de salud
Visita: `https://tu-dominio.com/api/health`

## 🚨 Solución de Problemas

### Problema: Archivos no se muestran
1. Verificar permisos: `sudo chown -R www-data:www-data /var/www/winzap/uploads/`
2. Verificar configuración de Nginx
3. Revisar logs: `pm2 logs winzap-server`

### Problema: Error 502 Bad Gateway
1. Verificar que la aplicación esté corriendo: `pm2 status`
2. Reiniciar aplicación: `pm2 restart winzap-server`
3. Verificar configuración de Nginx: `sudo nginx -t`

### Problema: SSL no funciona
1. Verificar certificado: `sudo certbot certificates`
2. Renovar certificado: `sudo certbot renew`

## 📱 Prueba de Responsividad

Después del despliegue, prueba tu sitio en:
- Chrome DevTools (F12 → Toggle device toolbar)
- Diferentes dispositivos móviles
- Diferentes navegadores

## 🎯 URLs Importantes

- **Sitio principal**: `https://tu-dominio.com`
- **API de archivos**: `https://tu-dominio.com/api/files`
- **Panel admin**: `https://tu-dominio.com/admin.html`
- **Salud del servidor**: `https://tu-dominio.com/api/health`

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `pm2 logs winzap-server`
2. Verifica la configuración de Nginx
3. Asegúrate de que el dominio esté configurado correctamente
4. Verifica que los puertos 80 y 443 estén abiertos

¡Tu plataforma WINZAP estará lista para recibir y mostrar archivos a usuarios de todo el mundo! 🌍
