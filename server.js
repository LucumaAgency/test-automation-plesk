// Server principal para Plesk - archivo en la raíz
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Datos en memoria (sin base de datos por ahora para simplificar)
let dataEntries = [];

// API endpoints
app.post('/api/data', (req, res) => {
  try {
    const { value } = req.body;

    if (!value || value.trim() === '') {
      return res.status(400).json({ error: 'El valor es requerido' });
    }

    const newEntry = {
      id: Date.now(),
      value: value,
      created_at: new Date().toISOString()
    };

    dataEntries.push(newEntry);

    res.status(201).json({
      success: true,
      id: newEntry.id,
      message: 'Dato guardado exitosamente'
    });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Error al guardar el dato' });
  }
});

app.get('/api/data', (req, res) => {
  res.json(dataEntries.slice(-100).reverse());
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    entries: dataEntries.length 
  });
});

// Servir el frontend para cualquier otra ruta
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});