// Service khusus modules-owner. TIDAK duplikat logic omzet/laba —
// angka finansial dihitung ulang dari reports.service.getSummary() yang
// sudah ada (reads dari Invoice + CostEntry). Di sini cuma menambahkan
// agregasi yang memang belum ada endpoint-nya: jumlah proyek aktif dan
// jumlah user per role, khusus untuk Dashboard Owner.
const { Project } = require('../../modules/projects/projects.model');
const { Admin } = require('../../modules/admin-auth/admin.model');
const reportsService = require('../../modules/reports/reports.service');

async function getSummary({ period } = {}) {
  const [financial, projectsActive, projectsTotal, usersActive, usersByRoleRaw] = await Promise.all([
    reportsService.getSummary({ period }),
    Project.count({ where: { status: 'in_progress' } }),
    Project.count(),
    Admin.count(),
    Admin.findAll({
      attributes: ['role', [Admin.sequelize.fn('COUNT', Admin.sequelize.col('id')), 'count']],
      group: ['role'],
      raw: true,
    }),
  ]);

  const usersByRole = usersByRoleRaw.reduce((acc, row) => {
    acc[row.role] = Number(row.count);
    return acc;
  }, {});

  return {
    period: financial.period,
    omzet: financial.revenue,
    totalCost: financial.totalCost,
    laba: financial.grossProfit,
    roi: financial.roi,
    projectsActive,
    projectsTotal,
    usersActive,
    usersByRole,
  };
}

module.exports = { getSummary };
