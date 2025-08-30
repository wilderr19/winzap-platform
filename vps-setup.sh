#!/bin/bash

# WINZAP VPS Setup Script
# Script para configurar el servidor en VPS (Ubuntu/Debian)

echo "🎮 WINZAP VPS Setup - Configurando servidor..."

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (versión LTS)
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 para gestión de procesos
echo "📦 Instalando PM2..."
sudo npm install -g pm2

# Instalar Nginx
echo "📦 Instalando Nginx..."
sudo apt install -y nginx

# Configurar firewall
echo "🔒 Configurando firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw --force enable

# Crear directorio del proyecto
echo "📁 Creando directorio del proyecto..."
sudo mkdir -p /var/www/winzap
sudo chown -R $USER:$USER /var/www/winzap
cd /var/www/winzap

# Crear estructura de directorios
mkdir -p uploads/images uploads/files logs

# Configurar Nginx
echo "🌐 Configurando Nginx..."
sudo tee /etc/nginx/sites-available/winzap > /dev/null <<EOF
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Redirigir a HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Configuración SSL (configurar después con Let's Encrypt)
    # ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    
    # Configuración de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Límites de subida
    client_max_body_size 500M;
    
    # Archivos estáticos
    location /uploads/ {
        alias /var/www/winzap/uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # API y aplicación
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/winzap /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Instalar Certbot para SSL
echo "🔒 Instalando Certbot para SSL..."
sudo apt install -y certbot python3-certbot-nginx

echo "✅ Configuración básica completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Sube tus archivos del proyecto a /var/www/winzap/"
echo "2. Ejecuta: npm install"
echo "3. Configura tu dominio en la configuración de Nginx"
echo "4. Ejecuta: sudo certbot --nginx -d tu-dominio.com"
echo "5. Inicia la aplicación: pm2 start vps-server.js --name winzap-server"
echo "6. Guarda la configuración PM2: pm2 save && pm2 startup"
echo ""
echo "🌐 Tu servidor estará disponible en: https://tu-dominio.com"
