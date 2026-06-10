const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const { getDb } = require('../database');
const authRoutes = require('./auth');

const verifyToken = authRoutes.verifyToken;
const requireRole = authRoutes.requireRole;

// GET všechny smlouvy (jen pro admin a smlouvy role)
router.get('/', verifyToken, (req, res) => {
  if (!['admin', 'smlouvy'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Nemáš oprávnění vidět smlouvy' });
  }

  const db = getDb();
  const { status, search } = req.query;

  let query = 'SELECT * FROM contracts WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (name LIKE ? OR counterparty LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY endDate ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Přidej days until expiration
    const contracts = rows.map(contract => ({
      ...contract,
      daysUntilExpiration: Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
      severity: calculateSeverity(new Date(contract.endDate))
    }));

    res.json(contracts);
  });
});

// GET detail smlouvy
router.get('/:id', verifyToken, (req, res) => {
  if (!['admin', 'smlouvy'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Nemáš oprávnění' });
  }

  const db = getDb();
  db.get('SELECT * FROM contracts WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Smlouva nenalezena' });
    }

    row.daysUntilExpiration = Math.ceil((new Date(row.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    row.severity = calculateSeverity(new Date(row.endDate));

    res.json(row);
  });
});

// POST nová smlouva
router.post('/', verifyToken, requireRole('admin', 'smlouvy'), (req, res) => {
  const { name, counterparty, startDate, endDate, notes } = req.body;

  if (!name || !endDate) {
    return res.status(400).json({ error: 'Jméno a datum konce jsou povinné' });
  }

  const db = getDb();
  const id = uuid();

  db.run(
    `INSERT INTO contracts (id, name, counterparty, startDate, endDate, status, notes, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, 'active', ?, datetime('now'), datetime('now'))`,
    [id, name, counterparty || null, startDate || null, endDate, notes || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id,
        name,
        counterparty,
        startDate,
        endDate,
        status: 'active',
        notes
      });
    }
  );
});

// PUT úprava smlouvy
router.put('/:id', verifyToken, requireRole('admin', 'smlouvy'), (req, res) => {
  const { name, counterparty, startDate, endDate, status, notes } = req.body;

  if (!name || !endDate) {
    return res.status(400).json({ error: 'Jméno a datum konce jsou povinné' });
  }

  const db = getDb();

  db.run(
    `UPDATE contracts 
     SET name = ?, counterparty = ?, startDate = ?, endDate = ?, status = ?, notes = ?, updatedAt = datetime('now')
     WHERE id = ?`,
    [name, counterparty || null, startDate || null, endDate, status || 'active', notes || null, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Smlouva nenalezena' });
      }

      res.json({ success: true, message: 'Smlouva aktualizována' });
    }
  );
});

// DELETE smlouva
router.delete('/:id', verifyToken, requireRole('admin', 'smlouvy'), (req, res) => {
  const db = getDb();

  db.run('DELETE FROM contracts WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Smlouva nenalezena' });
    }

    res.json({ success: true, message: 'Smlouva smazána' });
  });
});

function calculateSeverity(endDate) {
  const daysUntil = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return 'expired';
  if (daysUntil < 7) return 'critical';
  if (daysUntil < 30) return 'warning';
  return 'ok';
}

module.exports = router;
