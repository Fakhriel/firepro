// Pintu masuk tunggal untuk semua endpoint role Owner. Guard
// (requireAdminAuth + requireRole('owner')) dipasang SEKALI di sini,
// jadi tiap file *.routes.js di bawah modules-owner/ tidak perlu
// mengulang guard sendiri-sendiri.
//
// Login tetap lewat /api/admin-auth/login yang sudah ada (1 tabel
// `admins`, 1 sistem login untuk semua role — lihat migration
// 20260101000012-extend-admin-roles.js). Kalau user login dengan
// role 'owner', token JWT-nya otomatis bisa dipakai untuk semua route
// di bawah /api/owner/*.
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

// Belum ada: /attendance (belum ada tabel attendance) dan endpoint
// approve-pembelian di /inventory (belum ada tabel purchase_requests).
// Menyusul di tahap berikutnya bareng modules-supervisor & modules-technical.

module.exports = router;
