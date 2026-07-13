// Middleware yang memverifikasi token JWT admin. Dipasang di setiap
// route "/admin" dan route create/update/delete di seluruh module
// (inventory, invoices, quotations, maintenance, dst).
//
// Frontend (lib/auth.ts → adminApiFetch) mengirim header
// `Authorization: Bearer <token>` di setiap request, dan mengharapkan
// status 401 kalau token tidak valid/kedaluwarsa — jadi middleware ini
// HARUS selalu balas 401 (bukan 403 atau lainnya) untuk kasus tersebut,
// supaya frontend bisa auto-redirect ke /login.
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login kembali.' });
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    // Tersedia di seluruh controller lewat req.admin
    req.admin = { id: payload.sub, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa. Silakan login kembali.' });
  }
}

module.exports = { requireAdminAuth };