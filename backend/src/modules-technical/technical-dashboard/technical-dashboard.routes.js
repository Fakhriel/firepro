const express = require('express');
const { summaryHandler } = require('./technical-dashboard.controller');

const router = express.Router();

// GET /api/technical/dashboard/summary — stat card di
// pages/employee-technical/index.astro.
router.get('/summary', summaryHandler);

module.exports = router;
