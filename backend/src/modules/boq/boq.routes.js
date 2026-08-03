const express = require('express');
const {
  listHandler,
  summaryHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('./boq.controller');
const { requireAdminAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth, requireRole('admin', 'superadmin'));

// GET /api/boq/admin?projectId=&quotationId=&category=&search=&sortBy=&sortDir=
router.get('/admin', listHandler);
// GET /api/boq/summary/:projectId — total cost per kategori untuk 1 project
router.get('/summary/:projectId', summaryHandler);
router.get('/:id', getByIdHandler);
router.post('/', createHandler);
router.patch('/:id', updateHandler);
router.delete('/:id', deleteHandler);

module.exports = router;