const { DailyReport } = require('./daily-reports.model');
const { Admin } = require('../admin-auth/admin.model');
const { Project } = require('../projects/projects.model');

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function notFound(message = 'Laporan harian tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

function serialize(r) {
  const plain = r.toJSON ? r.toJSON() : r;
  return {
    id: String(plain.id),
    technicianId: plain.technicianId,
    projectId: plain.projectId,
    assignmentId: plain.assignmentId,
    reportDate: plain.reportDate,
    description: plain.description,
    materialsUsed: plain.materialsUsed ?? '',
    obstacle: plain.obstacle ?? '',
    status: plain.status,
    reviewedBy: plain.reviewedBy,
    reviewNote: plain.reviewNote ?? '',
    reviewedAt: plain.reviewedAt,
    technician: plain.technician ? { id: plain.technician.id, name: plain.technician.name } : undefined,
    project: plain.project ? { id: plain.project.id, name: plain.project.name, code: plain.project.code } : undefined,
  };
}

async function create({ technicianId, projectId, assignmentId, reportDate, description, materialsUsed, obstacle }) {
  if (!description || !String(description).trim()) throw badRequest('Deskripsi laporan wajib diisi.');

  const report = await DailyReport.create({
    technicianId,
    projectId: projectId || null,
    assignmentId: assignmentId || null,
    reportDate: reportDate || new Date().toISOString().split('T')[0],
    description: String(description).trim(),
    materialsUsed: materialsUsed ? String(materialsUsed).trim() : null,
    obstacle: obstacle ? String(obstacle).trim() : null,
    status: 'submitted',
  });
  return serialize(report);
}

async function listByTechnician(technicianId, { status } = {}) {
  const where = { technicianId };
  if (status) where.status = status;

  const reports = await DailyReport.findAll({
    where,
    include: [{ model: Project, as: 'project', attributes: ['id', 'name', 'code'] }],
    order: [['reportDate', 'DESC']],
  });
  return reports.map(serialize);
}

async function listAll({ projectId, status } = {}) {
  const where = {};
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;

  const reports = await DailyReport.findAll({
    where,
    include: [
      { model: Admin, as: 'technician', attributes: ['id', 'name'] },
      { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
    ],
    order: [['reportDate', 'DESC']],
  });
  return reports.map(serialize);
}

async function markReviewed(id, { reviewNote, reviewedBy }) {
  const report = await DailyReport.findByPk(id);
  if (!report) throw notFound();

  await report.update({
    status: 'reviewed',
    reviewNote: reviewNote ? String(reviewNote).trim() : null,
    reviewedBy,
    reviewedAt: new Date(),
  });
  return serialize(report);
}

module.exports = { create, listByTechnician, listAll, markReviewed };
