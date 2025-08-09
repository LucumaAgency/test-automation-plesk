#!/bin/bash

# Script de deploy para Plesk
# Este script se ejecuta automáticamente después de cada pull desde Git

echo "=== Iniciando deploy en Plesk ==="
echo "Fecha: $(/bin/date 2>/dev/null || echo 'N/A')"

# Directorio de la aplicación (ajustar según tu configuración de Plesk)
APP_DIR=$(pwd)

# Configurar PATH para incluir node y npm de Plesk
export PATH=/opt/plesk/node/20/bin:/opt/plesk/node/18/bin:/opt/plesk/node/16/bin:$PATH

# Verificar si npm está disponible
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm no encontrado. Verificar configuración de Node.js en Plesk"
    echo "Intentando con rutas alternativas..."
    
    # Buscar npm en ubicaciones comunes de Plesk
    for node_path in /opt/plesk/node/*/bin/npm; do
        if [ -f "$node_path" ]; then
            NPM_PATH="$node_path"
            NODE_VERSION=$(echo $node_path | grep -o 'node/[0-9]*' | cut -d'/' -f2)
            export PATH="/opt/plesk/node/$NODE_VERSION/bin:$PATH"
            echo "Usando Node.js v$NODE_VERSION desde Plesk"
            break
        fi
    done
    
    if [ -z "$NPM_PATH" ]; then
        echo "ERROR CRÍTICO: No se pudo encontrar npm. Instalar Node.js desde el panel de Plesk"
        exit 1
    fi
fi

# Navegar al directorio del backend
cd "$APP_DIR/backend"

# Instalar dependencias del backend
echo "Instalando dependencias del backend..."
npm ci --production || npm install --production

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
/bin/sleep 3 2>/dev/null || sleep 3
if command -v curl &> /dev/null && curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✓ Servidor respondiendo correctamente"
else
    echo "⚠ Advertencia: El servidor no responde en el puerto 3001"
fi

echo ""
echo "=== Información de diagnóstico ==="
echo "Node version: $(node --version 2>/dev/null || echo 'No disponible')"
echo "NPM version: $(npm --version 2>/dev/null || echo 'No disponible')"
echo "Directorio actual: $(pwd)"
echo "==================="