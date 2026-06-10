const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const { getDb } = require('../database');
const authRoutes = require('./auth');

const verifyToken = authRoutes.verifyToken;
const requireRole = authRoutes.requireRole;

// GET všechna vozidla
router.get('/', verifyToken, (req, res) => {
  if (!['admin', 'auta'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Nemáš oprávnění vidět vozidla' });
  }

  const db = getDb();
  const { status, search } = req.query;

  let query = 'SELECT * FROM vehicles WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (spz LIKE ? OR brand LIKE ? OR model LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY brand, model ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// GET vozidlo s jeho servisními údaji
router.get('/:id', verifyToken, (req, res) => {
  if (!['admin', 'auta'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Nemáš oprávnění' });
  }

  const db = getDb();

  db.get('SELECT * FROM vehicles WHERE id = ?', [req.params.id], (err, vehicle) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!vehicle) {
      return res.status(404).json({ error: 'Vozidlo nenalezeno' });
    }

    // Vezmi servisní údaje
    db.all('SELECT * FROM vehicle_services WHERE vehicleId = ? ORDER BY nextDue ASC', [req.params.id], (err, services) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Přidej daysUntil ke každému service
      services = services.map(s => ({
        ...s,
        daysUntil: Math.ceil((new Date(s.nextDue) - new Date()) / (1000 * 60 * 60 * 24)),
        severity: calculateSeverity(new Date(s.nextDue))
      }));

      res.json({
        ...vehicle,
        services
      });
    });
  });
});

// POST nové vozidlo
router.post('/', verifyToken, requireRole('admin', 'auta'), (req, res) => {
  const { spz, brand, model, year, vin, purchaseDate, purchasePrice } = req.body;

  if (!spz || !brand || !model) {
    return res.status(400).json({ error: 'SPZ, značka a model jsou povinné' });
  }

  const db = getDb();
  const id = uuid();

  db.run(
    `INSERT INTO vehicles (id, spz, brand, model, year, vin, purchaseDate, purchasePrice, status, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`,
    [id, spz, brand, model, year || null, vin || null, purchaseDate || null, purchasePrice || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Vozidlo s touto SPZ již existuje' });
        }
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ id, spz, brand, model, year, vin, purchaseDate, purchasePrice });
    }
  );
});

// PUT úprava vozidla
router.put('/:id', verifyToken, requireRole('admin', 'auta'), (req, res) => {
  const { spz, brand, model, year, vin, purchaseDate, purchasePrice, status } = req.body;

  if (!spz || !brand || !model) {
    return res.status(400).json({ error: 'SPZ, značka a model jsou povinné' });
  }

  const db = getDb();

  db.run(
    `UPDATE vehicles 
     SET spz = ?, brand = ?, model = ?, year = ?, vin = ?, purchaseDate = ?, purchasePrice = ?, status = ?, updatedAt = datetime('now')
     WHERE id = ?`,
    [spz, brand, model, year || null, vin || null, purchaseDate || null, purchasePrice || null, status || 'active', req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Vozidlo nenalezeno' });
      }

      res.json({ success: true, message: 'Vozidlo aktualizováno' });
    }
  );
});

// DELETE vozidlo
router.delete('/:id', verifyToken, requireRole('admin', 'auta'), (req, res) => {
  const db = getDb();

  // Smaž i servisní údaje
  db.run('DELETE FROM vehicle_services WHERE vehicleId = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.run('DELETE FROM vehicles WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Vozidlo nenalezeno' });
      }

      res.json({ success: true, message: 'Vozidlo smazáno' });
    });
  });
});

// POST servisní údaj (STK, pojištění, atd)
router.post('/:id/services', verifyToken, requireRole('admin', 'auta'), (req, res) => {
  const { type, nextDue, lastDate, cost, provider, notes } = req.body;

  if (!type || !nextDue) {
    return res.status(400).json({ error: 'Typ a datum jsou povinné' });
  }

  const db = getDb();
  const serviceId = uuid();

  db.run(
    `INSERT INTO vehicle_services (id, vehicleId, type, nextDue, lastDate, cost, provider, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [serviceId, req.params.id, type, nextDue, lastDate || null, cost || null, provider || null, notes || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ id: serviceId, type, nextDue, lastDate, cost, provider, notes });
    }
  );
});

// PUT aktualizace servisního údaje
router.put('/:vehicleId/services/:serviceId', verifyToken, requireRole('admin', 'auta'), (req, res) => {
  const { type, nextDue, lastDate, cost, provider, notes } = req.body;

  if (!type || !nextDue) {
    return res.status(400).json({ error: 'Typ a datum jsou povinné' });
  }

  const db = getDb();

  db.run(
    `UPDATE vehicle_services 
     SET type = ?, nextDue = ?, lastDate = ?, cost = ?, provider = ?, notes = ?
     WHERE id = ? AND vehicleId = ?`,
    [type, nextDue, lastDate || null, cost || null, provider || null, notes || null, req.params.serviceId, req.params.vehicleId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Servis nenalezen' });
      }

      res.json({ success: true, message: 'Servis aktualizován' });
    }
  );
});

// DELETE servisní údaj
router.delete('/:vehicleId/services/:serviceId', verifyToken, requireRole('admin', 'auta'), (req, res) => {
  const db = getDb();

  db.run('DELETE FROM vehicle_services WHERE id = ? AND vehicleId = ?', [req.params.serviceId, req.params.vehicleId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Servis nenalezen' });
    }

    res.json({ success: true, message: 'Servis smazán' });
  });
});

function calculateSeverity(date) {
  const daysUntil = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return 'expired';
  if (daysUntil < 14) return 'critical';
  if (daysUntil < 60) return 'warning';
  return 'ok';
}

module.exports = router;
