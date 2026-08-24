const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);


const SIGNATURES = [
  { ext: ['.jpg', '.jpeg'], bytes: [0xff, 0xd8, 0xff] },
  { ext: ['.png'], bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { ext: ['.gif'], bytes: [0x47, 0x49, 0x46, 0x38] }, // "GIF8"
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeExt(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext) ? ext : '';
}

function makeUploader(folder, { maxSizeMb = 10 } = {}) {
  const destDir = path.join(UPLOADS_ROOT, folder);
  ensureDir(destDir);

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, destDir);
    },
    filename(req, file, cb) {
      const ext = sanitizeExt(file.originalname);
      const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      cb(null, unique);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter(req, file, cb) {
      const extOk = ALLOWED_EXTENSIONS.has(path.extname(file.originalname || '').toLowerCase());
      const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
      if (extOk && mimeOk) return cb(null, true);
      cb(new Error('Hanya file gambar (jpg, jpeg, png, webp, gif) yang diperbolehkan.'));
    },
  });
}

const DOCUMENT_MIME_WHITELIST = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
];

const DOCUMENT_ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png', '.webp', '.zip',
]);

function sanitizeDocumentExt(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return DOCUMENT_ALLOWED_EXTENSIONS.has(ext) ? ext : '';
}

const DOCUMENT_SIGNATURES = [
  { ext: ['.pdf'], bytes: [0x25, 0x50, 0x44, 0x46] }, // "%PDF"
  { ext: ['.docx', '.xlsx', '.pptx', '.zip'], bytes: [0x50, 0x4b, 0x03, 0x04] }, // "PK\x03\x04"
  { ext: ['.doc', '.xls', '.ppt'], bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE compound file
];


const SIGNATURE_VERIFIED_EXTENSIONS = new Set(
  DOCUMENT_SIGNATURES.flatMap((s) => s.ext)
);

function makeDocumentUploader(folder, { maxSizeMb = 25 } = {}) {
  const destDir = path.join(UPLOADS_ROOT, folder);
  ensureDir(destDir);

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, destDir);
    },
    filename(req, file, cb) {
      const ext = sanitizeDocumentExt(file.originalname);
      const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      cb(null, unique);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter(req, file, cb) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const extOk = DOCUMENT_ALLOWED_EXTENSIONS.has(ext);
      if (!extOk) {
        return cb(new Error('Ekstensi file tidak didukung.'));
      }
      // octet-stream generik hanya ditoleransi untuk ekstensi yang isinya
      // akan diverifikasi lewat magic bytes setelah upload — untuk ekstensi
      // lain, mimetype harus jujur sesuai whitelist.
      const isGenericMime = file.mimetype === 'application/octet-stream';
      const mimeOk =
        DOCUMENT_MIME_WHITELIST.includes(file.mimetype) ||
        (isGenericMime && SIGNATURE_VERIFIED_EXTENSIONS.has(ext));
      if (!mimeOk) {
        return cb(new Error('Tipe file tidak didukung.'));
      }
      cb(null, true);
    },
  });
}

/**
 * Sama pola dengan verifyUploadedImage — dipasang SETELAH multer, cek isi
 * file yang sudah tersimpan terhadap magic bytes format yang diklaim.
 */
function verifyUploadedDocument(req, res, next) {
  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : req.file ? [req.file] : [];
  if (files.length === 0) return next();

  try {
    for (const file of files) {
      const ext = path.extname(file.filename).toLowerCase();
      const signatureDef = DOCUMENT_SIGNATURES.find((s) => s.ext.includes(ext));
      if (!signatureDef) continue; // tidak ada signature terdaftar — lewati, sudah cukup aman via whitelist

      const fd = fs.openSync(file.path, 'r');
      const buffer = Buffer.alloc(signatureDef.bytes.length);
      fs.readSync(fd, buffer, 0, signatureDef.bytes.length, 0);
      fs.closeSync(fd);

      const matches = signatureDef.bytes.every((byte, i) => buffer[i] === byte);
      if (!matches) {
        fs.unlinkSync(file.path);
        return res.status(400).json({
          error: 'Isi file tidak sesuai dengan format yang diklaim. File ditolak.',
        });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

function verifyUploadedImage(req, res, next) {
  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : req.file ? [req.file] : [];

  if (files.length === 0) return next();

  try {
    for (const file of files) {
      const ext = path.extname(file.filename).toLowerCase();

      if (ext === '.webp') continue;

      const signatureDef = SIGNATURES.find((s) => s.ext.includes(ext));
      if (!signatureDef) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Format file tidak didukung.' });
      }

      const fd = fs.openSync(file.path, 'r');
      const buffer = Buffer.alloc(signatureDef.bytes.length);
      fs.readSync(fd, buffer, 0, signatureDef.bytes.length, 0);
      fs.closeSync(fd);

      const matches = signatureDef.bytes.every((byte, i) => buffer[i] === byte);
      if (!matches) {
        fs.unlinkSync(file.path);
        return res.status(400).json({
          error: 'Isi file tidak sesuai dengan format gambar yang diklaim. File ditolak.',
        });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

function toPublicUrl(folder, filename) {
  const relativePath = `/uploads/${folder}/${filename}`;
  const base = process.env.BACKEND_BASE_URL;
  if (base) {
    return `${base.replace(/\/$/, '')}${relativePath}`;
  }
  return relativePath;
}

module.exports = { makeUploader, makeDocumentUploader, verifyUploadedImage, verifyUploadedDocument, toPublicUrl, UPLOADS_ROOT };
