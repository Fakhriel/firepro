const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('./inventory.controller');
const { requireAdminAuth } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth);

router.get('/admin', listHandler);
// GET /api/inventory/:id
router.get('/:id', getByIdHandler);
// POST /api/inventory
router.post('/', createHandler);
// PATCH /api/inventory/:id
router.patch('/:id', updateHandler);
// DELETE /api/inventory/:id
router.delete('/:id', deleteHandler);

module.exports = router;