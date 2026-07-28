const { Op } = require('sequelize');
const { Attendance } = require('./attendance.model');
const { Admin } = require('../admin-auth/admin.model');

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function todayDateOnly() {
  return new Date().toISOString().split('T')[0];
}

function serialize(a) {
  const plain = a.toJSON ? a.toJSON() : a;
  return {
    id: String(plain.id),
    adminId: plain.adminId,
    workDate: plain.workDate,
    checkInAt: plain.checkInAt,
    checkInLocation: plain.checkInLocation ?? '',
    checkOutAt: plain.checkOutAt,
    checkOutLocation: plain.checkOutLocation ?? '',
    status: plain.status,
    admin: plain.Admin ? { id: plain.Admin.id, name: plain.Admin.name, username: plain.Admin.username } : undefined,
  };
}

async function checkIn({ adminId, location }) {
  const workDate = todayDateOnly();
  const existing = await Attendance.findOne({ where: { adminId, workDate } });
  if (existing) throw badRequest('Anda sudah check-in hari ini.');

  const record = await Attendance.create({
    adminId,
    workDate,
    checkInAt: new Date(),
    checkInLocation: location || null,
    status: 'checked_in',
  });
  return serialize(record);
}

async function checkOut({ adminId, location }) {
  const workDate = todayDateOnly();
  const existing = await Attendance.findOne({ where: { adminId, workDate } });
  if (!existing) throw badRequest('Anda belum check-in hari ini.');
  if (existing.status === 'checked_out') throw badRequest('Anda sudah check-out hari ini.');

  await existing.update({
    checkOutAt: new Date(),
    checkOutLocation: location || null,
    status: 'checked_out',
  });
  return serialize(existing);
}

async function getToday(adminId) {
  const workDate = todayDateOnly();
  const record = await Attendance.findOne({ where: { adminId, workDate } });
  return record ? serialize(record) : null;
}

async function listHistory(adminId, { days = 30 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDateOnly = since.toISOString().split('T')[0];

  const records = await Attendance.findAll({
    where: { adminId, workDate: { [Op.gte]: sinceDateOnly } },
    order: [['workDate', 'DESC']],
  });
  return records.map(serialize);
}

// Dipakai Supervisor untuk monitoring kehadiran tim (default role='karyawan').
async function listByDate({ date, role } = {}) {
  const workDate = date || todayDateOnly();
  const adminWhere = {};
  if (role) adminWhere.role = role;

  const records = await Attendance.findAll({
    where: { workDate },
    include: [{ model: Admin, as: 'Admin', where: adminWhere, attributes: ['id', 'name', 'username', 'role'] }],
    order: [['checkInAt', 'ASC']],
  });
  return records.map(serialize);
}

module.exports = { checkIn, checkOut, getToday, listHistory, listByDate };
