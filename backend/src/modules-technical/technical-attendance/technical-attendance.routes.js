const express = require('express');
const {
  checkInHandler,
  checkOutHandler,
  todayHandler,
  historyHandler,
} = require('./technical-attendance.controller');

const router = express.Router();

// GET /api/technical/attendance/today — status absensi hari ini.
router.get('/today', todayHandler);
// GET /api/technical/attendance/history — riwayat 30 hari terakhir.
router.get('/history', historyHandler);
// POST /api/technical/attendance/check-in — body: { location? }
router.post('/check-in', checkInHandler);
// POST /api/technical/attendance/check-out — body: { location? }
router.post('/check-out', checkOutHandler);

module.exports = router;
