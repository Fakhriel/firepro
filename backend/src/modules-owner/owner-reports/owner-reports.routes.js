// Reuse penuh reports.controller & reports.service dari modules/reports —
// ini juga sumber angka "omzet" & "laba" yang dipakai owner-dashboard.
const express = require('express');
const {
  listCostsHandler,
  createCostHandler,
  createCostBreakdownHandler,
  summaryHandler,
  listProjectsRoiHandler,
  monthlyTrendHandler,
} = require('../../modules/reports/reports.controller');

const router = express.Router();

// GET /api/owner/reports/summary?period= — Revenue/Biaya/Laba/ROI di
// pages/owner/reports.astro.
router.get('/summary', summaryHandler);
// GET /api/owner/reports/monthly-trend?months= — tren omzet/biaya per
// bulan, dipakai chart di Reports (12 bulan) & Dashboard (6 bulan).
router.get('/monthly-trend', monthlyTrendHandler);
// GET /api/owner/reports/projects-roi — breakdown laba per proyek untuk
// tabel "Profitabilitas per Proyek" di pages/owner/reports.astro.
router.get('/projects-roi', listProjectsRoiHandler);
// GET /api/owner/reports/costs?period=
router.get('/costs', listCostsHandler);
router.post('/costs', createCostHandler);
router.post('/costs/breakdown', createCostBreakdownHandler);

module.exports = router;
