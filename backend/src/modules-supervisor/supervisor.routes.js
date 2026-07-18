// Pintu masuk tunggal untuk semua endpoint role Supervisor. Sama seperti
// modules-owner/owner.routes.js: guard dipasang SEKALI di sini, login
// tetap lewat /api/admin-auth/login (1 tabel `admins`, 1 sistem login).
const express = require('express');
const { requireAdminAuth, requireRole } = require('../middleware/auth');

const dashboardRoutes = require('./supervisor-dashboard/supervisor-dashboard.routes');
const projectsRoutes = require('./supervisor-projects/supervisor-projects.routes');
const assignmentsRoutes = require('./supervisor-assignments/supervisor-assignments.routes');
const techniciansRoutes = require('./supervisor-technicians/supervisor-technicians.routes');
const documentationRoutes = require('./supervisor-documentation/supervisor-documentation.routes');
const inventoryRoutes = require('./supervisor-inventory/supervisor-inventory.routes');
const maintenanceRoutes = require('./supervisor-maintenance/supervisor-maintenance.routes');
const dailyReportRoutes = require('./supervisor-daily-report/supervisor-daily-report.routes');
const attendanceRoutes = require('./supervisor-attendance/supervisor-attendance.routes');

const router = express.Router();

router.use(requireAdminAuth, requireRole('supervisor'));

router.use('/dashboard', dashboardRoutes);
router.use('/projects', projectsRoutes);
router.use('/assignments', assignmentsRoutes);
router.use('/technicians', techniciansRoutes);
router.use('/documentation', documentationRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/daily-report', dailyReportRoutes);
router.use('/attendance', attendanceRoutes);

// Semua modul dari spesifikasi Supervisor sudah lengkap: dashboard,
// projects (view+progress+approve), assignments (assign teknisi),
// technicians (directory), documentation (upload), inventory (view+
// request), maintenance (view+assign+selesai), daily-report (monitoring),
// attendance (sendiri + monitoring tim).

module.exports = router;
