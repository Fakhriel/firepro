const express = require('express');
const { summaryHandler } = require('./supervisor-dashboard.controller');

const router = express.Router();

// GET /api/supervisor/dashboard/summary
router.get('/summary', summaryHandler);

module.exports = router;
