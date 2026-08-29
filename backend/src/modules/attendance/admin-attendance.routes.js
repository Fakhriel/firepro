const express = require('express');
const {
  checkInHandler,
  checkOutHandler,
  todayHandler,
  historyHandler,
} = require('./admin-attendance.controller');

const router = express.Router();

router.get('/today', todayHandler);
router.get('/history', historyHandler);
router.post('/check-in', checkInHandler);
router.post('/check-out', checkOutHandler);

module.exports = router;
