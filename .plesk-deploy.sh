#!/bin/bash

# Script de deploy para Plesk
# Este script se ejecuta automáticamente después de cada pull desde Git

echo "=== Iniciando deploy en Plesk ==="
echo "Fecha: $(date)"

# Directorio de la aplicación (ajustar según tu configuración de Plesk)
APP_DIR=$(pwd)

# Navegar al directorio del backend
cd "$APP_DIR/backend"

# Instalar dependencias del backend
echo "Instalando dependencias del backend..."
npm ci --production

# Copiar archivo de configuración si existe
if [ -f "$APP_DIR/.env.production" ]; then
    echo "Copiando archivo de configuración de producción..."
    cp "$APP_DIR/.env.production" "$APP_DIR/backend/.env"
fi

# Verificar si el frontend está compilado
if [ -d "$APP_DIR/frontend/dist" ]; then
    echo "Frontend compilado encontrado ✓"
else
    echo "ERROR: No se encontró el frontend compilado en frontend/dist"
    exit 1
fi

# Reiniciar el servicio Node.js (ajustar según tu configuración)
# Opción 1: Si usas PM2
if command -v pm2 &> /dev/null; then
    echo "Reiniciando aplicación con PM2..."
    pm2 stop webapp 2>/dev/null || true
    pm2 delete webapp 2>/dev/null || true
    NODE_ENV=production pm2 start "$APP_DIR/backend/server.js" --name webapp
    pm2 save
fi

# Opción 2: Si usas systemd
# sudo systemctl restart webapp

# Opción 3: Si usas Passenger (Plesk)
# touch "$APP_DIR/backend/tmp/restart.txt"

echo "=== Deploy completado exitosamente ==="
echo ""

# Verificar que el servidor está respondiendo
sleep 3
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✓ Servidor respondiendo correctamente"
else
    echo "⚠ Advertencia: El servidor no responde en el puerto 3001"
fi