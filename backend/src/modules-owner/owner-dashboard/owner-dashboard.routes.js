const express = require('express');
const { summaryHandler } = require('./owner-dashboard.controller');

const router = express.Router();

// GET /api/owner/dashboard/summary?period= — 4 stat card di
// pages/owner/index.astro (stat-omzet, stat-laba, stat-projects-active,
// stat-users-active). Guard requireAdminAuth + requireRole('owner')
// sudah dipasang satu kali di modules-owner/owner.routes.js.
router.get('/summary', summaryHandler);

module.exports = router;
