# WebApp Fullstack con Deploy Automático en Plesk

Aplicación web fullstack con React (frontend) y Node.js/Express (backend) que almacena datos en MySQL, con CI/CD automatizado mediante GitHub Actions y deploy en Plesk.

## Estructura del Proyecto

```
├── frontend/          # Aplicación React + Vite
├── backend/           # API Node.js/Express
├── database/          # Scripts SQL
├── .github/workflows/ # GitHub Actions CI/CD
├── nginx.conf         # Configuración para Plesk
└── .plesk-deploy.sh   # Script de deploy automático
```

## Flujo de Deploy

1. **Desarrollo**: Push a rama `main`
2. **GitHub Actions**: Build automático del frontend
3. **Rama Production**: Se crea/actualiza con código compilado
4. **Plesk**: Pull de rama `production` y ejecuta deploy

## Configuración en Plesk

### 1. Configurar Git en Plesk

1. En tu dominio, ir a "Git"
2. Agregar repositorio: `https://github.com/tu-usuario/tu-repo.git`
3. Seleccionar rama: `production` (NO `main`)
4. Modo de deploy: "Automático"
5. Script de deploy: `.plesk-deploy.sh`

### 2. Configurar Base de Datos

1. Crear base de datos MySQL en Plesk
2. Ejecutar script `database/init.sql`
3. Crear archivo `.env.production` en la raíz:

```env
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_NAME=webapp_db
PORT=3001
NODE_ENV=production
```

### 3. Configurar Nginx

En Plesk > Configuración de Apache y nginx > Directivas adicionales de nginx:

```nginx
# Copiar contenido de nginx.conf
```

### 4. Configurar Node.js

1. En Plesk > Node.js
2. Crear aplicación Node.js
3. Directorio: `/backend`
4. Archivo de inicio: `server.js`
5. Modo: Production

## Desarrollo Local

### Requisitos

- Node.js >= 16
- MySQL
- npm o yarn

### Instalación

```bash
# Instalar todas las dependencias
npm run install:all

# Configurar base de datos
npm run setup:db

# Crear archivo .env en backend/
cp backend/.env.example backend/.env
# Editar con tus credenciales locales
```

### Ejecutar en desarrollo

```bash
# Frontend y backend simultáneamente
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Build de producción

```bash
npm run build
```

## GitHub Actions

El workflow se activa automáticamente con cada push a `main`:

1. Compila el frontend
2. Crea/actualiza rama `production`
3. Elimina archivos innecesarios
4. Conserva solo código de producción

## Estructura de la Base de Datos

```sql
CREATE TABLE data_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

- `POST /api/data` - Guardar nuevo dato
- `GET /api/data` - Obtener últimos 100 datos
- `GET /api/health` - Health check

## Solución de Problemas

### El servidor no responde

1. Verificar logs en Plesk > Node.js > Logs
2. Verificar archivo `.env` en producción
3. Verificar conexión a base de datos

### Frontend no se muestra

1. Verificar que `frontend/dist` existe
2. Revisar configuración de nginx
3. Verificar permisos de archivos

### GitHub Actions falla

1. Verificar permisos del repositorio
2. Revisar logs del workflow
3. Verificar que la rama `main` existe

## Seguridad

- **NUNCA** commits el archivo `.env`
- Usar variables de entorno en producción
- Configurar CORS apropiadamente
- Validar todos los inputs del usuario
- Usar HTTPS en producción