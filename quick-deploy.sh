#!/bin/bash

# WINZAP Quick Deploy - Versión simplificada
# Ejecuta este comando en tu VPS para instalar todo automáticamente

echo "🚀 WINZAP Quick Deploy"
echo "======================"

# Una sola línea para instalar todo
curl -fsSL https://raw.githubusercontent.com/wilderr19/winzap-platform/main/deploy-from-github.sh | bash

echo ""
echo "✅ ¡Instalación completada!"
echo "Tu servidor WINZAP está funcionando en el puerto 3000"
