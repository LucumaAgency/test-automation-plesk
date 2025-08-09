// Server principal con conexión a MariaDB/MySQL
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Configuración de la base de datos
let pool = null;

async function initializeDatabase() {
  try {
    // Crear pool de conexiones
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'webapp_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Verificar conexión
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MariaDB/MySQL establecida');
    
    // Crear tabla si no existe
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS data_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Tabla data_entries verificada/creada');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    console.log('⚠️  Continuando con almacenamiento en memoria como fallback');
    return false;
  }
}

// Fallback: datos en memoria si la DB no está disponible
let memoryStorage = [];
let useDatabase = false;

// API endpoints
app.post('/api/data', async (req, res) => {
  try {
    const { value } = req.body;

    if (!value || value.trim() === '') {
      return res.status(400).json({ error: 'El valor es requerido' });
    }

    if (useDatabase && pool) {
      // Guardar en base de datos
      try {
        const [result] = await pool.execute(
          'INSERT INTO data_entries (value) VALUES (?)',
          [value]
        );
        
        res.status(201).json({
          success: true,
          id: result.insertId,
          message: 'Dato guardado exitosamente en base de datos'
        });
      } catch (dbError) {
        console.error('Error guardando en DB:', dbError);
        // Fallback a memoria
        const newEntry = {
          id: Date.now(),
          value: value,
          created_at: new Date().toISOString()
        };
        memoryStorage.push(newEntry);
        
        res.status(201).json({
          success: true,
          id: newEntry.id,
          message: 'Dato guardado exitosamente (en memoria)'
        });
      }
    } else {
      // Guardar en memoria
      const newEntry = {
        id: Date.now(),
        value: value,
        created_at: new Date().toISOString()
      };
      memoryStorage.push(newEntry);
      
      res.status(201).json({
        success: true,
        id: newEntry.id,
        message: 'Dato guardado exitosamente (en memoria)'
      });
    }
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Error al guardar el dato' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    if (useDatabase && pool) {
      // Obtener de base de datos
      const [rows] = await pool.execute(
        'SELECT * FROM data_entries ORDER BY created_at DESC LIMIT 100'
      );
      res.json(rows);
    } else {
      // Obtener de memoria
      res.json(memoryStorage.slice(-100).reverse());
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    // Fallback a memoria
    res.json(memoryStorage.slice(-100).reverse());
  }
});

app.get('/api/health', async (req, res) => {
  let dbStatus = 'Not configured';
  let entriesCount = memoryStorage.length;
  
  if (pool) {
    try {
      const [result] = await pool.execute('SELECT COUNT(*) as count FROM data_entries');
      dbStatus = 'Connected';
      entriesCount = result[0].count;
    } catch (error) {
      dbStatus = 'Error: ' + error.message;
    }
  }
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    storage: useDatabase ? 'database' : 'memory',
    database: dbStatus,
    entries: entriesCount
  });
});

// Endpoint para verificar conexión a DB
app.get('/api/db-test', async (req, res) => {
  if (!pool) {
    return res.json({ 
      connected: false, 
      message: 'Pool de conexiones no inicializado',
      config: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'webapp_db'
      }
    });
  }
  
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute('SELECT 1 as test');
    connection.release();
    
    res.json({ 
      connected: true, 
      message: 'Conexión exitosa a MariaDB/MySQL',
      result: result[0]
    });
  } catch (error) {
    res.json({ 
      connected: false, 
      message: error.message,
      config: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'webapp_db'
      }
    });
  }
});

// Servir el frontend para cualquier otra ruta
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Inicializar base de datos y luego iniciar servidor
initializeDatabase().then((dbConnected) => {
  useDatabase = dbConnected;
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`💾 Storage mode: ${useDatabase ? 'Database' : 'Memory'}`);
    if (!useDatabase) {
      console.log('⚠️  Para usar base de datos, configura las variables de entorno:');
      console.log('   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    }
  });
});