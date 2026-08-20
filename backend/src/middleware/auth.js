const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { Admin } = require('../modules/admin-auth/admin.model');

async function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login kembali.' });
  }

  const token = header.slice('Bearer '.length).trim();

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch (err) {
    return res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa. Silakan login kembali.' });
  }

  try {
    
    const admin = await Admin.findByPk(payload.sub, { attributes: ['id', 'isActive'] });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Akun ini sudah tidak aktif. Silakan hubungi Owner.' });
    }
    req.admin = { id: payload.sub, username: payload.username, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.admin || !allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ error: `Hanya role (${allowedRoles.join(', ')}) yang boleh mengakses fitur ini.` });
    }
    next();
  };
}

module.exports = { requireAdminAuth, requireRole };
