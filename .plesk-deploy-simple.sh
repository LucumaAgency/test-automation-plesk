#!/bin/bash

# Script simplificado para Plesk - Versión mínima
echo "=== Deploy simplificado para Plesk ==="

cd backend

# Intentar encontrar npm en las rutas comunes de Plesk
NPM_CMD=""
for npm_path in /opt/plesk/node/20/bin/npm /opt/plesk/node/18/bin/npm /opt/plesk/node/16/bin/npm; do
    if [ -f "$npm_path" ]; then
        NPM_CMD="$npm_path"
        echo "Usando npm desde: $NPM_CMD"
        break
    fi
done

if [ -z "$NPM_CMD" ]; then
    echo "ERROR: No se encontró npm. Por favor:"
    echo "1. Instala Node.js desde el panel de Plesk"
    echo "2. Ve a 'Configuración de Node.js' en tu dominio"
    echo "3. Selecciona una versión de Node.js (recomendado: 18 o 20)"
    exit 1
fi

# Instalar dependencias
echo "Instalando dependencias..."
$NPM_CMD install --production

echo "=== Deploy completado ==="