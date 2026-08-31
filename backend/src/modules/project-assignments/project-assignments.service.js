const { Op } = require('sequelize');
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

  // SEBELUMNYA technicianId tidak divalidasi sama sekali — bisa nunjuk ke
  // akun role apa saja (termasuk Admin/Supervisor), atau ID yang tidak
  // ada sekalipun (baru gagal belakangan lewat FK error mentah / 500).
  const [project, technician] = await Promise.all([
    Project.findByPk(projectId),
    Admin.findByPk(technicianId),
  ]);
  if (!project) throw badRequest('Project tidak ditemukan.');
  if (!technician) throw badRequest('Teknisi tidak ditemukan.');
  if (technician.role !== 'karyawan') {
    throw badRequest('Assignment hanya bisa ditugaskan ke akun dengan role Karyawan Teknisi.');
  }

  // Bug QA Round 3 (laporan Supervisor): sebelumnya teknisi yang sama
  // bisa di-assign berkali-kali ke proyek yang sama tanpa penolakan apa
  // pun, bikin baris duplikat di tabel. Cek dulu apakah kombinasi
  // project+teknisi ini masih aktif (belum 'done') sebelum insert baru.
  const existingActive = await ProjectAssignment.findOne({
    where: { projectId, technicianId, status: { [Op.in]: ['assigned', 'in_progress'] } },
  });
  if (existingActive) {
    throw badRequest('Teknisi ini sudah ditugaskan ke proyek ini dan masih aktif. Batalkan penugasan lama dulu kalau mau menugaskan ulang.');
  }

  const a = await ProjectAssignment.create({
    projectId,
    technicianId,
    assignedBy,
    notes: notes ? String(notes).trim() : null,
    status: 'assigned',
  });
  return getById(a.id);
}

// Graf transisi status yang valid — mencegah lompat/mundur bebas (mis.
// 'done' balik ke 'assigned' tanpa alasan). Transisi assigned->done
// LANGSUNG tetap diizinkan karena UI teknisi ("Tandai Selesai") memang
// selalu tampil terlepas dari status saat ini — jadi guard ini fokus
// mengunci 'done' sebagai status akhir, bukan memaksakan urutan step.
const VALID_STATUS_TRANSITIONS = {
  assigned: ['in_progress', 'done'],
  in_progress: ['done', 'assigned'], // boleh mundur ke assigned kalau pekerjaan dibatalkan sementara
  done: [], // status akhir — tidak bisa diubah lagi lewat endpoint ini
};

async function updateStatus(id, status) {
  if (!STATUSES.includes(status)) {
    throw badRequest(`status harus salah satu dari: ${STATUSES.join(', ')}.`);
  }
  const a = await ProjectAssignment.findByPk(id);
  if (!a) throw notFound();

  if (a.status === status) {
    return getById(id);
  }
  const allowedNext = VALID_STATUS_TRANSITIONS[a.status] ?? [];
  if (!allowedNext.includes(status)) {
    throw badRequest(`Tidak bisa mengubah status dari '${a.status}' ke '${status}'.`);
  }

  await a.update({ status });
  return getById(id);
}

async function update(id, { notes, technicianId }) {
  const a = await ProjectAssignment.findByPk(id);
  if (!a) throw notFound();

  if (technicianId !== undefined) {
    const technician = await Admin.findByPk(technicianId);
    if (!technician) throw badRequest('Teknisi tidak ditemukan.');
    if (technician.role !== 'karyawan') {
      throw badRequest('Assignment hanya bisa ditugaskan ke akun dengan role Karyawan Teknisi.');
    }
    const existingActive = await ProjectAssignment.findOne({
      where: {
        id: { [Op.ne]: id },
        projectId: a.projectId,
        technicianId,
        status: { [Op.in]: ['assigned', 'in_progress'] },
      },
    });
    if (existingActive) {
      throw badRequest('Teknisi ini sudah ditugaskan ke proyek ini dan masih aktif.');
    }
  }

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
