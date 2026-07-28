const express = require('express');
const {
  listHandler,
  createHandler,
  updateHandler,
  updateStatusHandler,
  deleteHandler,
} = require('./supervisor-assignments.controller');

const router = express.Router();

// GET /api/supervisor/assignments?projectId=&technicianId=&status=
router.get('/', listHandler);
// POST /api/supervisor/assignments — body: { projectId, technicianId, notes? }
router.post('/', createHandler);
router.patch('/:id', updateHandler);
router.patch('/:id/status', updateStatusHandler);
router.delete('/:id', deleteHandler);

module.exports = router;
