const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const contractsRoutes = require('./routes/contracts');
const vehiclesRoutes = require('./routes/vehicles');
const assetsRoutes = require('./routes/assets');

app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/assets', assetsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server běží na http://localhost:${PORT}`);
    console.log(`📊 SQLite databáze inicializována`);
  });
}).catch(err => {
  console.error('❌ Chyba při inicializaci databáze:', err);
  process.exit(1);
});
