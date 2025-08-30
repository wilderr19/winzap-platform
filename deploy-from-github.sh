#!/bin/bash

# WINZAP VPS Deploy from GitHub
# Script para instalar directamente desde GitHub

echo "🎮 WINZAP - Instalación automática desde GitHub"
echo "================================================"

# Variables
REPO_URL="https://github.com/wilderr19/winzap-platform.git"
PROJECT_DIR="/var/www/winzap"
SERVICE_NAME="winzap-server"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si se ejecuta como root
if [[ $EUID -eq 0 ]]; then
   print_error "No ejecutes este script como root. Usa un usuario con sudo."
   exit 1
fi

print_status "Iniciando instalación de WINZAP desde GitHub..."

# 1. Actualizar sistema
print_status "Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependencias básicas
print_status "Instalando dependencias básicas..."
sudo apt install -y curl wget git unzip software-properties-common

# 3. Instalar Node.js (versión LTS)
print_status "Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación de Node.js
node_version=$(node --version)
npm_version=$(npm --version)
print_success "Node.js instalado: $node_version"
print_success "NPM instalado: $npm_version"

# 4. Instalar PM2
print_status "Instalando PM2..."
sudo npm install -g pm2

# 5. Instalar Nginx
print_status "Instalando Nginx..."
sudo apt install -y nginx

# 6. Configurar firewall
print_status "Configurando firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw --force enable

# 7. Crear directorio del proyecto y clonar repositorio
print_status "Clonando repositorio desde GitHub..."
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# Si el directorio ya existe, hacer backup
if [ -d "$PROJECT_DIR/.git" ]; then
    print_warning "Proyecto existente encontrado. Creando backup..."
    sudo mv $PROJECT_DIR ${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)
    sudo mkdir -p $PROJECT_DIR
    sudo chown -R $USER:$USER $PROJECT_DIR
fi

# Clonar repositorio
cd /var/www
git clone $REPO_URL winzap
cd $PROJECT_DIR

# 8. Instalar dependencias del proyecto
print_status "Instalando dependencias del proyecto..."
if [ -f "package-vps.json" ]; then
    cp package-vps.json package.json
elif [ ! -f "package.json" ]; then
    print_error "No se encontró package.json o package-vps.json"
    exit 1
fi

npm install

# 9. Crear directorios necesarios
print_status "Creando estructura de directorios..."
mkdir -p uploads/images uploads/files logs backups

# Configurar permisos
sudo chown -R www-data:www-data uploads/
sudo chmod -R 755 uploads/

# 10. Configurar Nginx
print_status "Configurando Nginx..."

# Pedir dominio al usuario
echo ""
read -p "Ingresa tu dominio (ejemplo: winzapgamer.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="localhost"
    print_warning "No se ingresó dominio, usando localhost"
fi

# Crear configuración de Nginx
sudo tee /etc/nginx/sites-available/winzap > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirigir a HTTPS (descomenta después de configurar SSL)
    # return 301 https://\$server_name\$request_uri;
    
    # Configuración temporal para HTTP
    client_max_body_size 500M;
    
    # Archivos estáticos
    location /uploads/ {
        alias $PROJECT_DIR/uploads/;
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

# Verificar configuración
if sudo nginx -t; then
    print_success "Configuración de Nginx válida"
    sudo systemctl restart nginx
    sudo systemctl enable nginx
else
    print_error "Error en configuración de Nginx"
    exit 1
fi

# 11. Configurar variables de entorno
print_status "Configurando variables de entorno..."
cat > .env <<EOF
NODE_ENV=production
PORT=3000
DOMAIN=$DOMAIN
EOF

# 12. Iniciar aplicación con PM2
print_status "Iniciando aplicación..."

# Detener instancia anterior si existe
pm2 delete $SERVICE_NAME 2>/dev/null || true

# Iniciar nueva instancia
if [ -f "vps-server.js" ]; then
    pm2 start vps-server.js --name $SERVICE_NAME
elif [ -f "server.js" ]; then
    pm2 start server.js --name $SERVICE_NAME
else
    print_error "No se encontró archivo de servidor (vps-server.js o server.js)"
    exit 1
fi

# Configurar PM2 para inicio automático
pm2 save
pm2 startup | grep -E '^sudo' | bash

# 13. Instalar Certbot para SSL
print_status "Instalando Certbot para SSL..."
sudo apt install -y certbot python3-certbot-nginx

# 14. Crear script de actualización automática
print_status "Creando script de actualización..."
cat > update-winzap.sh <<'EOF'
#!/bin/bash
echo "🔄 Actualizando WINZAP..."
cd /var/www/winzap
git pull origin main
npm install
pm2 restart winzap-server
echo "✅ WINZAP actualizado correctamente"
EOF

chmod +x update-winzap.sh

# 15. Crear script de backup
print_status "Creando script de backup..."
cat > backup-winzap.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/www/winzap/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "📦 Creando backup de WINZAP..."
mkdir -p $BACKUP_DIR

# Backup de base de datos
if [ -f "/var/www/winzap/winzap-database.json" ]; then
    cp /var/www/winzap/winzap-database.json $BACKUP_DIR/database_$DATE.json
fi

# Backup de uploads (solo metadatos, no archivos grandes)
tar -czf $BACKUP_DIR/uploads_metadata_$DATE.tar.gz uploads/ --exclude="*.zip" --exclude="*.rar" --exclude="*.exe" --exclude="*.iso"

echo "✅ Backup completado: $BACKUP_DIR/"
EOF

chmod +x backup-winzap.sh

# 16. Configurar cron para backups automáticos
print_status "Configurando backups automáticos..."
(crontab -l 2>/dev/null; echo "0 2 * * * cd /var/www/winzap && ./backup-winzap.sh") | crontab -

print_success "¡Instalación completada!"
echo ""
echo "================================================"
echo "🎉 WINZAP instalado correctamente desde GitHub"
echo "================================================"
echo ""
echo "📋 Información del servidor:"
echo "   • Dominio: $DOMAIN"
echo "   • Directorio: $PROJECT_DIR"
echo "   • Puerto: 3000"
echo "   • Servicio PM2: $SERVICE_NAME"
echo ""
echo "🌐 URLs importantes:"
echo "   • Sitio web: http://$DOMAIN"
echo "   • API: http://$DOMAIN/api/health"
echo "   • Admin: http://$DOMAIN/admin.html"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver logs: pm2 logs $SERVICE_NAME"
echo "   • Reiniciar: pm2 restart $SERVICE_NAME"
echo "   • Actualizar: ./update-winzap.sh"
echo "   • Backup: ./backup-winzap.sh"
echo ""
echo "🔒 Configurar SSL (recomendado):"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "📱 Actualizar configuración frontend:"
echo "   Edita api-config.js y cambia la URL por: https://$DOMAIN"
echo ""
print_success "¡Tu servidor WINZAP está listo! 🚀"
