const { ProjectAssignment } = require('./project-assignments.model');
const { Admin } = require('../admin-auth/admin.model');
const { Project } = require('../projects/projects.model');

const STATUSES = ['assigned', 'in_progress', 'done'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function notFound(message = 'Tugas/penugasan tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

function serialize(a) {
  const plain = a.toJSON ? a.toJSON() : a;
  return {
    id: String(plain.id),
    projectId: plain.projectId,
    technicianId: plain.technicianId,
    assignedBy: plain.assignedBy,
    status: plain.status,
    notes: plain.notes ?? '',
    project: plain.project ? { id: plain.project.id, name: plain.project.name, code: plain.project.code, location: plain.project.location } : undefined,
    technician: plain.technician ? { id: plain.technician.id, name: plain.technician.name } : undefined,
  };
}

const includeAll = [
  { model: Project, as: 'project', attributes: ['id', 'name', 'code', 'location'] },
  { model: Admin, as: 'technician', attributes: ['id', 'name'] },
];

async function list({ projectId, technicianId, status } = {}) {
  const where = {};
  if (projectId) where.projectId = projectId;
  if (technicianId) where.technicianId = technicianId;
  if (status) where.status = status;

  const rows = await ProjectAssignment.findAll({ where, include: includeAll, order: [['createdAt', 'DESC']] });
  return rows.map(serialize);
}

async function listByTechnician(technicianId) {
  return list({ technicianId });
}

async function getById(id) {
  const a = await ProjectAssignment.findByPk(id, { include: includeAll });
  if (!a) throw notFound();
  return serialize(a);
}

async function create({ projectId, technicianId, assignedBy, notes }) {
  if (!projectId) throw badRequest('Project wajib dipilih.');
  if (!technicianId) throw badRequest('Teknisi wajib dipilih.');

  const a = await ProjectAssignment.create({
    projectId,
    technicianId,
    assignedBy,
    notes: notes ? String(notes).trim() : null,
    status: 'assigned',
  });
  return getById(a.id);
}

async function updateStatus(id, status) {
  if (!STATUSES.includes(status)) {
    throw badRequest(`status harus salah satu dari: ${STATUSES.join(', ')}.`);
  }
  const a = await ProjectAssignment.findByPk(id);
  if (!a) throw notFound();
  await a.update({ status });
  return getById(id);
}

async function update(id, { notes, technicianId }) {
  const a = await ProjectAssignment.findByPk(id);
  if (!a) throw notFound();
  await a.update({
    ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
    ...(technicianId !== undefined && { technicianId }),
  });
  return getById(id);
}

async function remove(id) {
  const a = await ProjectAssignment.findByPk(id);
  if (!a) throw notFound();
  await a.destroy();
}

module.exports = { list, listByTechnician, getById, create, updateStatus, update, remove };
