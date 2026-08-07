
const express = require('express');
const { requireAdminAuth, requireRole } = require('../middleware/auth');

const dashboardRoutes = require('./technical-dashboard/technical-dashboard.routes');
const tasksRoutes = require('./technical-tasks/technical-tasks.routes');
const attendanceRoutes = require('./technical-attendance/technical-attendance.routes');
const dailyReportRoutes = require('./technical-daily-report/technical-daily-report.routes');
const inventoryRequestRoutes = require('./technical-inventory-request/technical-inventory-request.routes');
const profileRoutes = require('./technical-profile/technical-profile.routes');

const router = express.Router();

router.use(requireAdminAuth, requireRole('karyawan'));

router.use('/dashboard', dashboardRoutes);
router.use('/tasks', tasksRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/daily-report', dailyReportRoutes);
router.use('/inventory-request', inventoryRequestRoutes);
router.use('/profile', profileRoutes);


module.exports = router;
