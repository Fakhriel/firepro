const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('./clients.controller');
const { requireAdminAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth, requireRole('admin', 'superadmin'));

// GET /api/clients?search=&status=&page=&limit=
router.get('/', listHandler);
// GET /api/clients/:id
router.get('/:id', getByIdHandler);
// POST /api/clients
router.post('/', createHandler);
// PATCH /api/clients/:id
router.patch('/:id', updateHandler);
// DELETE /api/clients/:id
router.delete('/:id', deleteHandler);

module.exports = router;