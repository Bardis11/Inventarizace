const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');

// Dummy users pro testování
const dummyUsers = {
  'demo@tomas.cz': {
    email: 'demo@tomas.cz',
    username: 'Demo User'
  }
};

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, heslo a role jsou povinné' });
  }

  if (password !== 'demo') {
    return res.status(401).json({ error: 'Špatné heslo' });
  }

  if (!['admin', 'smlouvy', 'auta', 'majetek'].includes(role)) {
    return res.status(400).json({ error: 'Neplatná role' });
  }

  const user = dummyUsers[email] || { email, username: email.split('@')[0] };

  const token = {
    userId: uuid(),
    email: user.email,
    username: user.username,
    role: role,
    issuedAt: new Date()
  };

  res.json({
    success: true,
    token: Buffer.from(JSON.stringify(token)).toString('base64'),
    user: {
      email: user.email,
      username: user.username,
      role: role
    }
  });
});

// Middleware pro ověření tokenu
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Chybí token' });
  }

  try {
    const token = JSON.parse(Buffer.from(authHeader.replace('Bearer ', ''), 'base64').toString());
    req.user = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Neplatný token' });
  }
}

// Role check middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Nemáš oprávnění' });
    }
    next();
  };
}

// Export
router.verifyToken = verifyToken;
router.requireRole = requireRole;

module.exports = router;
