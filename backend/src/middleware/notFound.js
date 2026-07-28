// Middleware paling akhir sebelum errorHandler — menangkap request ke
// route yang tidak terdaftar sama sekali (misal typo path dari frontend).
function notFound(req, res, next) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} tidak ditemukan.` });
}

module.exports = { notFound };