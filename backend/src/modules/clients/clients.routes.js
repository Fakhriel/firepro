const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('./clients.controller');
const { requireAdminAuth } = require('../../middleware/auth');

const router = express.Router();

// Semua endpoint clients khusus admin dashboard (bukan public-facing),
// jadi requireAdminAuth dipasang di seluruh route, bukan cuma mutasi.
router.use(requireAdminAuth);

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