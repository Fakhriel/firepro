const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('./quotations.controller');
const { requireAdminAuth } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth);

// GET /api/quotations/admin — dipanggil dari quotations.astro (loadQuotations).
router.get('/admin', listHandler);
router.get('/:id', getByIdHandler);
// POST /api/quotations — dipanggil dari saveQuotation() saat quotation-id kosong.
router.post('/', createHandler);
// PATCH /api/quotations/:id — dipanggil dari saveQuotation() saat edit.
router.patch('/:id', updateHandler);
router.delete('/:id', deleteHandler);

module.exports = router;