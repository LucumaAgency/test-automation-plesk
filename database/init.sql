-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS webapp_db;
USE webapp_db;

-- Crear tabla para almacenar los datos
CREATE TABLE IF NOT EXISTS data_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
);

-- Insertar algunos datos de ejemplo (opcional)
INSERT INTO data_entries (value) VALUES 
    ('Primer dato de ejemplo'),
    ('Segundo dato de ejemplo'),
    ('Tercer dato de ejemplo');