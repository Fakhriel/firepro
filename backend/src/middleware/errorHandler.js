const env = require('../config/env');

function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err);


  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      error: 'Data ini masih terhubung ke data lain sehingga tidak bisa dihapus/diubah. Hubungi developer untuk pengecekan relasi lebih lanjut.',
      ...(env.nodeEnv === 'development' && { detail: err.parent?.sqlMessage ?? err.message }),
    });
  }

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
