const express = require('express');
const {
  listHandler,
  getByIdHandler,
  assignTechnicianHandler,
  completeHandler,
} = require('./supervisor-maintenance.controller');

const router = express.Router();

// GET /api/supervisor/maintenance
router.get('/', listHandler);
router.get('/:id', getByIdHandler);
// PATCH /api/supervisor/maintenance/:id/assign — body: { technician }
router.patch('/:id/assign', assignTechnicianHandler);
// PATCH /api/supervisor/maintenance/:id/complete
router.patch('/:id/complete', completeHandler);

module.exports = router;
