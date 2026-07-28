const { Project } = require('../../modules/projects/projects.model');
const { Admin } = require('../../modules/admin-auth/admin.model');
const { DailyReport } = require('../../modules/daily-reports/daily-reports.model');
const { PurchaseRequest } = require('../../modules/purchase-requests/purchase-requests.model');

async function summaryHandler(req, res, next) {
  try {
    const [activeProjects, technicians, pendingReports, pendingRequests] = await Promise.all([
      Project.count({ where: { status: ['planning', 'in_progress'] } }),
      Admin.count({ where: { role: 'karyawan' } }),
      DailyReport.count({ where: { status: 'submitted' } }),
      PurchaseRequest.count({ where: { status: 'pending' } }),
    ]);

    res.status(200).json({
      data: { activeProjects, technicians, pendingReports, pendingRequests },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { summaryHandler };
