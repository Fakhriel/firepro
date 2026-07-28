// Pintu masuk tunggal untuk semua endpoint role Teknisi Lapangan. Sama
// pola dengan owner.routes.js & supervisor.routes.js: guard dipasang
// SEKALI di sini, login tetap lewat /api/admin-auth/login (1 tabel
// `admins`, 1 sistem login untuk semua role).
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

// TIDAK ada route untuk projects/clients/invoices lain — sesuai
// spesifikasi awal, Teknisi Lapangan hanya boleh melihat tugas sendiri
// (lewat /tasks, yang scope-nya sudah dibatasi ke technicianId = diri
// sendiri di technical-tasks.controller.js).

module.exports = router;
