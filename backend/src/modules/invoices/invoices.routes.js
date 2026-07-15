const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('./invoices.controller');
const { requireAdminAuth } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth);

// GET /api/invoices/admin — dipanggil dari invoices.astro (loadInvoices).
router.get('/admin', listHandler);
// GET /api/invoices/:id
router.get('/:id', getByIdHandler);
// POST /api/invoices — belum dipakai frontend (belum ada form), tapi
// disiapkan untuk dipanggil dari module projects/quotations nanti.
router.post('/', createHandler);
// PATCH /api/invoices/:id
router.patch('/:id', updateHandler);
// DELETE /api/invoices/:id
router.delete('/:id', deleteHandler);

module.exports = router;