// Rate limiter khusus endpoint sensitif (login admin) — mencegah brute
// force tebak password.
const rateLimit = require('express-rate-limit');

// Maksimal 10 percobaan login per 15 menit per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.' },
});


const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak request. Coba lagi sebentar lagi.' },
});

module.exports = { loginLimiter, generalLimiter };