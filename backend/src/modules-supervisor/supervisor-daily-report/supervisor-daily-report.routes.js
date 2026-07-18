const express = require('express');
const { listHandler, reviewHandler } = require('./supervisor-daily-report.controller');

const router = express.Router();

// GET /api/supervisor/daily-report?projectId=&status= — monitoring
// laporan harian seluruh teknisi.
router.get('/', listHandler);
// PATCH /api/supervisor/daily-report/:id/review — body: { reviewNote? }
router.patch('/:id/review', reviewHandler);

module.exports = router;
