// Reuse penuh reports.controller & reports.service dari modules/reports —
// ini juga sumber angka "omzet" & "laba" yang dipakai owner-dashboard.
const express = require('express');
const {
  listCostsHandler,
  createCostHandler,
  createCostBreakdownHandler,
  summaryHandler,
} = require('../../modules/reports/reports.controller');

const router = express.Router();

// GET /api/owner/reports/summary?period= — Revenue/Biaya/Laba/ROI di
// pages/owner/reports.astro.
router.get('/summary', summaryHandler);
// GET /api/owner/reports/costs?period=
router.get('/costs', listCostsHandler);
router.post('/costs', createCostHandler);
router.post('/costs/breakdown', createCostBreakdownHandler);

module.exports = router;
