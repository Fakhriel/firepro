const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeExt(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '';
}

function makeUploader(folder, { maxSizeMb = 10 } = {}) {
  const destDir = path.join(UPLOADS_ROOT, folder);
  ensureDir(destDir);

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, destDir);
    },
    filename(req, file, cb) {
      const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${sanitizeExt(file.originalname)}`;
      cb(null, unique);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter(req, file, cb) {
      if (/^image\//.test(file.mimetype)) return cb(null, true);
      cb(new Error('Hanya file gambar yang diperbolehkan.'));
    },
  });
}

function toPublicUrl(folder, filename) {
  const relativePath = `/uploads/${folder}/${filename}`;
  const base = process.env.BACKEND_BASE_URL;
  if (base) {
    return `${base.replace(/\/$/, '')}${relativePath}`;
  }
  return relativePath;
}

module.exports = { makeUploader, toPublicUrl, UPLOADS_ROOT };
