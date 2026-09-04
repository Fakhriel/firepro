
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
    omzet: financial.kpi.paidRevenue,
    totalCost: financial.kpi.totalCost,
    laba: financial.kpi.estimatedProfit,
    roi: financial.kpi.roi,
    projectsActive,
    projectsTotal,
    usersActive,
    usersByRole,
  };
}

module.exports = { getSummary };
