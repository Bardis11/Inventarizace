const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const { getDb } = require('../database');
const authRoutes = require('./auth');

const verifyToken = authRoutes.verifyToken;
const requireRole = authRoutes.requireRole;

// GET všechen majetek
router.get('/', verifyToken, (req, res) => {
  if (!['admin', 'majetek'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Nemáš oprávnění vidět majetek' });
  }

  const db = getDb();
  const { status, category, search } = req.query;

  let query = 'SELECT * FROM assets WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR location LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY category, name ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Přidej info o revizích
    const assets = rows.map(asset => ({
      ...asset,
      revisionStatus: calculateRevisionStatus(asset.lastRevision, asset.revisionInterval),
      warrantyStatus: asset.warrantyEndDate ? calculateWarrantyStatus(asset.warrantyEndDate) : null
    }));

    res.json(assets);
  });
});

// GET detail majetku
router.get('/:id', verifyToken, (req, res) => {
  if (!['admin', 'majetek'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Nemáš oprávnění' });
  }

  const db = getDb();

  db.get('SELECT * FROM assets WHERE id = ?', [req.params.id], (err, asset) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!asset) {
      return res.status(404).json({ error: 'Majetek nenalezen' });
    }

    // Vezmi revize
    db.all('SELECT * FROM asset_revisions WHERE assetId = ? ORDER BY revisionDate DESC', [req.params.id], (err, revisions) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      asset.revisions = revisions;
      asset.revisionStatus = calculateRevisionStatus(asset.lastRevision, asset.revisionInterval);
      asset.warrantyStatus = asset.warrantyEndDate ? calculateWarrantyStatus(asset.warrantyEndDate) : null;

      res.json(asset);
    });
  });
});

// POST nový majetek
router.post('/', verifyToken, requireRole('admin', 'majetek'), (req, res) => {
  const { name, category, purchaseDate, purchasePrice, currentValue, location, warrantyEndDate, revisionInterval, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Jméno majetku je povinné' });
  }

  const db = getDb();
  const id = uuid();

  db.run(
    `INSERT INTO assets (id, name, category, purchaseDate, purchasePrice, currentValue, location, status, warrantyEndDate, revisionInterval, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, datetime('now'), datetime('now'))`,
    [id, name, category || null, purchaseDate || null, purchasePrice || null, currentValue || null, location || null, warrantyEndDate || null, revisionInterval || null, notes || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id,
        name,
        category,
        purchaseDate,
        purchasePrice,
        currentValue,
        location,
        warrantyEndDate,
        revisionInterval,
        notes,
        status: 'active'
      });
    }
  );
});

// PUT úprava majetku
router.put('/:id', verifyToken, requireRole('admin', 'majetek'), (req, res) => {
  const { name, category, purchaseDate, purchasePrice, currentValue, location, status, warrantyEndDate, lastRevision, revisionInterval, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Jméno majetku je povinné' });
  }

  const db = getDb();

  db.run(
    `UPDATE assets
     SET name = ?, category = ?, purchaseDate = ?, purchasePrice = ?, currentValue = ?, location = ?, status = ?, warrantyEndDate = ?, lastRevision = ?, revisionInterval = ?, notes = ?, updatedAt = datetime('now')
     WHERE id = ?`,
    [name, category || null, purchaseDate || null, purchasePrice || null, currentValue || null, location || null, status || 'active', warrantyEndDate || null, lastRevision || null, revisionInterval || null, notes || null, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Majetek nenalezen' });
      }

      res.json({ success: true, message: 'Majetek aktualizován' });
    }
  );
});

// DELETE majetek
router.delete('/:id', verifyToken, requireRole('admin', 'majetek'), (req, res) => {
  const db = getDb();

  // Smaž i revize
  db.run('DELETE FROM asset_revisions WHERE assetId = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.run('DELETE FROM assets WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Majetek nenalezen' });
      }

      res.json({ success: true, message: 'Majetek smazán' });
    });
  });
});

// POST revize majetku
router.post('/:id/revisions', verifyToken, requireRole('admin', 'majetek'), (req, res) => {
  const { revisionDate, result, notes } = req.body;

  if (!revisionDate) {
    return res.status(400).json({ error: 'Datum revize je povinné' });
  }

  const db = getDb();
  const revisionId = uuid();

  // Spočítej next due
  db.get('SELECT revisionInterval FROM assets WHERE id = ?', [req.params.id], (err, asset) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!asset) {
      return res.status(404).json({ error: 'Majetek nenalezen' });
    }

    let nextDue = null;
    if (asset.revisionInterval) {
      const date = new Date(revisionDate);
      date.setMonth(date.getMonth() + asset.revisionInterval);
      nextDue = date.toISOString().split('T')[0];
    }

    db.run(
      `INSERT INTO asset_revisions (id, assetId, revisionDate, nextDue, result, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [revisionId, req.params.id, revisionDate, nextDue, result || null, notes || null],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Aktualizuj lastRevision v assets
        db.run(
          'UPDATE assets SET lastRevision = ? WHERE id = ?',
          [revisionDate, req.params.id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
              id: revisionId,
              revisionDate,
              nextDue,
              result,
              notes
            });
          }
        );
      }
    );
  });
});

// Kategorie (pro výběr)
router.get('/categories/list', verifyToken, (req, res) => {
  const categories = ['IT', 'Nábytek', 'Zařízení', 'Stroje', 'Ostatní'];
  res.json(categories);
});

function calculateRevisionStatus(lastRevision, interval) {
  if (!interval) return null;
  
  if (!lastRevision) {
    return {
      status: 'pending',
      severity: 'critical',
      message: 'Revize nebyla provedena'
    };
  }

  const lastDate = new Date(lastRevision);
  const nextDueDate = new Date(lastDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + interval);

  const daysUntil = Math.ceil((nextDueDate - new Date()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return {
      status: 'overdue',
      severity: 'critical',
      message: `Revize je ${Math.abs(daysUntil)} dní po lhůtě`
    };
  }

  if (daysUntil < 30) {
    return {
      status: 'upcoming',
      severity: 'warning',
      message: `Revize je splatná za ${daysUntil} dní`
    };
  }

  return {
    status: 'ok',
    severity: 'ok',
    message: `Příští revize: ${nextDueDate.toLocaleDateString('cs-CZ')}`
  };
}

function calculateWarrantyStatus(warrantyEndDate) {
  const endDate = new Date(warrantyEndDate);
  const daysUntil = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return { status: 'expired', severity: 'ok', message: 'Záruka vypršela' };
  }

  if (daysUntil < 30) {
    return { status: 'expiring', severity: 'warning', message: `Záruka vyprší za ${daysUntil} dní` };
  }

  return { status: 'valid', severity: 'ok', message: `Záruka do ${endDate.toLocaleDateString('cs-CZ')}` };
}

module.exports = router;
