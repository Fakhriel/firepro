const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('./maintenance.controller');
const { requireAdminAuth } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth);

// GET /api/maintenance/admin — dipanggil dari maintenance.astro (loadMaintenance).
router.get('/admin', listHandler);
router.get('/:id', getByIdHandler);
router.post('/', createHandler);
router.patch('/:id', updateHandler);
router.delete('/:id', deleteHandler);

module.exports = router;