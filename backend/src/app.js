const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const adminAuthRoutes = require('./modules/admin-auth/admin-auth.routes');
const adminsRoutes = require('./modules/admin-auth/admins-auth.routes');
const clientsRoutes = require('./modules/clients/clients.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const invoicesRoutes = require('./modules/invoices/invoices.routes');
const projectsRoutes = require('./modules/projects/projects.routes');
const quotationsRoutes = require('./modules/quotations/quotations.routes');
const maintenanceRoutes = require('./modules/maintenance/maintenance.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const ownerRoutes = require('./modules-owner/owner.routes');
const supervisorRoutes = require('./modules-supervisor/supervisor.routes');
const technicalRoutes = require('./modules-technical/technical.routes');


const app = express();


// crossOriginResourcePolicy dilonggarkan supaya foto di /uploads bisa
// di-<img src> dari frontend Astro yang jalan di port/origin berbeda —
// default helmet ('same-origin') akan memblokirnya.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

app.use('/uploads', express.static(require('path').join(__dirname, '..', 'uploads')));


app.use('/api', generalLimiter);

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'FIREPRO backend' });
});

app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/technical', technicalRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
