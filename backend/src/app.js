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


const app = express();


app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());


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

app.use(notFound);
app.use(errorHandler);

module.exports = app;