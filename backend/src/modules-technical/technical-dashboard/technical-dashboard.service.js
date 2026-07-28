const { ProjectAssignment } = require('../../modules/project-assignments/project-assignments.model');
const { PurchaseRequest } = require('../../modules/purchase-requests/purchase-requests.model');
const { DailyReport } = require('../../modules/daily-reports/daily-reports.model');
const attendanceService = require('../../modules/attendance/attendance.service');

function todayDateOnly() {
  return new Date().toISOString().split('T')[0];
}

async function getSummary({ technicianId }) {
  const [tasksActive, todayAttendance, requestsPending, reportToday] = await Promise.all([
    ProjectAssignment.count({ where: { technicianId, status: ['assigned', 'in_progress'] } }),
    attendanceService.getToday(technicianId),
    PurchaseRequest.count({ where: { requestedBy: technicianId, status: 'pending' } }),
    DailyReport.findOne({ where: { technicianId, reportDate: todayDateOnly() } }),
  ]);

  return {
    tasksActive,
    attendanceStatus: todayAttendance?.status ?? 'not_checked_in',
    requestsPending,
    reportSubmittedToday: Boolean(reportToday),
  };
}

module.exports = { getSummary };
