require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let pool;

async function initializeDatabase() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'webapp_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    await pool.execute('SELECT 1');
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

app.post('/api/data', async (req, res) => {
  try {
    const { value } = req.body;

    if (!value || value.trim() === '') {
      return res.status(400).json({ error: 'El valor es requerido' });
    }

    const [result] = await pool.execute(
      'INSERT INTO data_entries (value, created_at) VALUES (?, NOW())',
      [value]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Dato guardado exitosamente'
    });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Error al guardar el dato' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM data_entries ORDER BY created_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});