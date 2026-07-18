const express = require('express');
const {
  checkInHandler,
  checkOutHandler,
  todayHandler,
  historyHandler,
  teamHandler,
} = require('./supervisor-attendance.controller');

const router = express.Router();

// --- Absensi milik sendiri (Supervisor juga karyawan lapangan) ---
router.get('/today', todayHandler);
router.get('/history', historyHandler);
router.post('/check-in', checkInHandler);
router.post('/check-out', checkOutHandler);

// --- Monitoring tim ---
// GET /api/supervisor/attendance/team?date=YYYY-MM-DD
router.get('/team', teamHandler);

module.exports = router;
