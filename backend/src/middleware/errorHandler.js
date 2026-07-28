// Error handler global — HARUS didaftarkan paling terakhir di app.js
// (setelah semua route), karena Express mengenali middleware 4-argumen
// sebagai error handler berdasarkan urutan pendaftaran.
//
// Semua controller di seluruh module melempar error ke sini lewat
// `next(err)` daripada handle try/catch berulang-ulang di tiap route,
// supaya format response error konsisten di semua endpoint.
const env = require('../config/env');

function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err);

  const status = err.status || err.statusCode || 500;
  const message = err.expose
    ? err.message
    : status === 500
      ? 'Terjadi kesalahan pada server.'
      : err.message;

  res.status(status).json({
    error: message,
    // Stack trace hanya muncul di development, jangan pernah di production
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };