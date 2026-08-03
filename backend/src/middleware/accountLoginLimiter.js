const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 menit
const WINDOW_MS = 15 * 60 * 1000; // reset hitungan kalau sudah 15 menit tidak ada percobaan gagal

/** @type {Map<string, { count: number, lastFailAt: number, lockedUntil: number | null }>} */
const attemptStore = new Map();

function getClientIp(req) {
  // req.ip sudah menghormati 'trust proxy' kalau di-set di app.js;
  // fallback ke socket address kalau req.ip kosong.
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function buildKey(req) {
  const identifier = String(req.body?.username || '').trim().toLowerCase();
  const ip = getClientIp(req);
  // Identifier kosong (misal body belum divalidasi) tetap dikunci per-IP
  // supaya tidak completely bypass limiter.
  return `${ip}::${identifier || '(no-username)'}`;
}

function cleanupIfStale(entry) {
  if (!entry) return null;
  const now = Date.now();
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    // Lockout sudah habis — reset total, bukan cuma unlock.
    return null;
  }
  if (!entry.lockedUntil && now - entry.lastFailAt > WINDOW_MS) {
    
    return null;
  }
  return entry;
}


function checkAccountLock(req, res, next) {
  const key = buildKey(req);
  const entry = cleanupIfStale(attemptStore.get(key));
  if (!entry) {
    attemptStore.delete(key);
    return next();
  }

  if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
    const remainingSec = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return res.status(429).json({
      error: `Terlalu banyak percobaan login untuk akun ini. Coba lagi dalam ${Math.ceil(remainingSec / 60)} menit.`,
    });
  }

  next();
}

function recordLoginFailure(req) {
  const key = buildKey(req);
  const now = Date.now();
  const existing = cleanupIfStale(attemptStore.get(key)) || { count: 0, lastFailAt: now, lockedUntil: null };

  existing.count += 1;
  existing.lastFailAt = now;

  if (existing.count >= MAX_FAILED_ATTEMPTS) {
    existing.lockedUntil = now + LOCKOUT_MS;
  }

  attemptStore.set(key, existing);
}


function recordLoginSuccess(req) {
  attemptStore.delete(buildKey(req));
}

module.exports = { checkAccountLock, recordLoginFailure, recordLoginSuccess };
