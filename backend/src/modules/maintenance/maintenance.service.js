const { Op } = require('sequelize');
const { MaintenanceSchedule } = require('./maintenance.model');
const { escapeLike } = require('../../utils/escapeLike');

const STATUSES = ['scheduled', 'due_soon', 'overdue', 'completed'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function notFound(message = 'Jadwal maintenance tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

// Bentuk response persis kontrak MaintenanceSchedule di maintenance.astro.
function serialize(m) {
  const plain = m.toJSON ? m.toJSON() : m;
  return {
    id: String(plain.id),
    client: plain.client,
    location: plain.location,
    equipment: plain.equipment,
    lastService: plain.lastService ?? '',
    nextService: plain.nextService,
    technician: plain.technician ?? '',
    notes: plain.notes ?? '',
    status: plain.status,
  };
}

async function list({ search, status } = {}) {
  const where = {};
  if (status && STATUSES.includes(status)) where.status = status;
  if (search) {
    where[Op.or] = [
      { client: { [Op.like]: `%${escapeLike(search)}%` } },
      { location: { [Op.like]: `%${escapeLike(search)}%` } },
      { equipment: { [Op.like]: `%${escapeLike(search)}%` } },
    ];
  }

  const schedules = await MaintenanceSchedule.findAll({ where, order: [['nextService', 'ASC']] });
  return schedules.map(serialize);
}

async function getById(id) {
  const m = await MaintenanceSchedule.findByPk(id);
  if (!m) throw notFound();
  return serialize(m);
}

function validateInput(body, { partial = false } = {}) {
  const { client, location, equipment, nextService, status } = body;

  if (!partial || client !== undefined) {
    if (!client || !String(client).trim()) throw badRequest('Nama klien wajib diisi.');
  }
  if (!partial || location !== undefined) {
    if (!location || !String(location).trim()) throw badRequest('Lokasi wajib diisi.');
  }
  if (!partial || equipment !== undefined) {
    if (!equipment || !String(equipment).trim()) throw badRequest('Peralatan wajib diisi.');
  }
  if (!partial || nextService !== undefined) {
    if (!nextService) throw badRequest('Jadwal berikutnya wajib diisi.');
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    throw badRequest(`status harus salah satu dari: ${STATUSES.join(', ')}.`);
  }

  return {
    ...(client !== undefined && { client: String(client).trim() }),
    ...(location !== undefined && { location: String(location).trim() }),
    ...(equipment !== undefined && { equipment: String(equipment).trim() }),
    ...(body.lastService !== undefined && { lastService: body.lastService || null }),
    ...(nextService !== undefined && { nextService }),
    ...(body.technician !== undefined && { technician: body.technician ? String(body.technician).trim() : null }),
    ...(body.notes !== undefined && { notes: body.notes ? String(body.notes).trim() : null }),
    ...(status !== undefined && { status }),
  };
}

async function create(body) {
  const payload = validateInput(body);
  const m = await MaintenanceSchedule.create({ status: 'scheduled', ...payload });
  return serialize(m);
}

async function update(id, body) {
  const m = await MaintenanceSchedule.findByPk(id);
  if (!m) throw notFound();
  const payload = validateInput(body, { partial: true });
  await m.update(payload);
  return serialize(m);
}

async function remove(id) {
  const m = await MaintenanceSchedule.findByPk(id);
  if (!m) throw notFound();
  await m.destroy();
}

module.exports = { list, getById, create, update, remove };