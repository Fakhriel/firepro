const express = require('express');
const { requireAdminAuth, requireRole } = require('../middleware/auth');

const dashboardRoutes = require('./owner-dashboard/owner-dashboard.routes');
const usersRoutes = require('./owner-users/owner-users.routes');
const clientsRoutes = require('./owner-clients/owner-clients.routes');
const projectsRoutes = require('./owner-projects/owner-projects.routes');
const quotationsRoutes = require('./owner-quotations/owner-quotations.routes');
const invoicesRoutes = require('./owner-invoices/owner-invoices.routes');
const maintenanceRoutes = require('./owner-maintenance/owner-maintenance.routes');
const inventoryRoutes = require('./owner-inventory/owner-inventory.routes');
const reportsRoutes = require('./owner-reports/owner-reports.routes');
const attendanceRoutes = require('./owner-attendance/owner-attendance.routes');

const router = express.Router();

router.use(requireAdminAuth, requireRole('owner'));

router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/clients', clientsRoutes);
router.use('/projects', projectsRoutes);
router.use('/quotations', quotationsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportsRoutes);
router.use('/attendance', attendanceRoutes);

module.exports = router;
