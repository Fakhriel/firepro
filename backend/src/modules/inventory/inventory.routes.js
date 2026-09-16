const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  recordMovementHandler,
} = require('./inventory.controller');
const { requireAdminAuth, requireRole } = require('../../middleware/auth');
const { makeUploader, verifyUploadedImage, toPublicUrl } = require('../../utils/uploadStorage');

const upload = makeUploader('inventory');
const router = express.Router();

router.use(requireAdminAuth, requireRole('admin'));

// POST /api/inventory/upload-image — multipart/form-data, field: image
// Dipakai drag & drop di form Inventory Admin (sama seperti Owner).
router.post('/upload-image', upload.single('image'), verifyUploadedImage, (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('File gambar wajib diupload.');
      err.status = 400;
      err.expose = true;
      throw err;
    }
    res.status(201).json({ data: { url: toPublicUrl('inventory', req.file.filename) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/admin?search=&category=&status=&lowStockOnly=true
router.get('/admin', listHandler);
// GET /api/inventory/:id
router.get('/:id', getByIdHandler);
// POST /api/inventory
router.post('/', createHandler);
// PATCH /api/inventory/:id
router.patch('/:id', updateHandler);
// DELETE /api/inventory/:id
router.delete('/:id', deleteHandler);

// Stock In / Out / Adjustment — satu-satunya cara stok berubah.
// POST /api/inventory/:id/movements  { type, quantity, note }
router.post('/:id/movements', recordMovementHandler);

module.exports = router;
