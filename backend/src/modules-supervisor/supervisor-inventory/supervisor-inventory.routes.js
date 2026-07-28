const express = require('express');
const {
  listInventoryHandler,
  listRequestsHandler,
  approveRequestHandler,
  rejectRequestHandler,
} = require('./supervisor-inventory.controller');

const router = express.Router();

// GET /api/supervisor/inventory — lihat stok (read-only).
router.get('/', listInventoryHandler);

// --- Purchase requests dari teknisi ---
// GET /api/supervisor/inventory/requests?status=&projectId=
router.get('/requests', listRequestsHandler);
router.patch('/requests/:id/approve', approveRequestHandler);
router.patch('/requests/:id/reject', rejectRequestHandler);

module.exports = router;
