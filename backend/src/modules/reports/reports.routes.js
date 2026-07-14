const express = require('express');
const {
  listCostsHandler,
  createCostHandler,
  createCostBreakdownHandler,
  summaryHandler,
} = require('./reports.controller');
const { requireAdminAuth } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth);

// GET /api/reports/summary?period= — 4 stat card (Revenue/Biaya/Profit/ROI)
// + panel "Kalkulasi ROI" di reports.astro.
router.get('/summary', summaryHandler);
// GET /api/reports/costs?period= — tabel "Riwayat Input Biaya".
router.get('/costs', listCostsHandler);
// POST /api/reports/costs — dipanggil dari modal "Input Biaya Cepat"
// (cost-modal-save), 1 kategori per submit.
router.post('/costs', createCostHandler);
// POST /api/reports/costs/breakdown — dipanggil dari tombol "Simpan"
// di panel "Rincian Biaya" (5 kolom sekaligus).
router.post('/costs/breakdown', createCostBreakdownHandler);

module.exports = router;