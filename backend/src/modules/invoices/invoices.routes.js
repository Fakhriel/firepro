const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('./invoices.controller');
const { requireAdminAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth, requireRole('admin', 'superadmin'));

router.get('/admin', listHandler);
// GET /api/invoices/:id
router.get('/:id', getByIdHandler);

router.post('/', createHandler);
// PATCH /api/invoices/:id
router.patch('/:id', updateHandler);
// DELETE /api/invoices/:id
router.delete('/:id', deleteHandler);

module.exports = router;