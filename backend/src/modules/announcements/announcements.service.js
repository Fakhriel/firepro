const { Announcement } = require('./announcements.model');
const { Admin } = require('../admin-auth/admin.model');
const notifications = require('../notifications/notifications.service');


const ALLOWED_TARGET_ROLES = ['supervisor', 'karyawan', 'admin'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function serialize(a) {
  const plain = a.toJSON ? a.toJSON() : a;
  return {
    id: plain.id,
    title: plain.title,
    message: plain.message,
    targetRoles: plain.targetRoles.split(','),
    recipientCount: plain.recipientCount,
    authorName: plain.author?.name ?? '-',
    createdAt: plain.createdAt,
  };
}

async function create({ title, message, targetRoles }, createdBy) {
  if (!title || !String(title).trim()) throw badRequest('Judul pengumuman wajib diisi.');
  if (!message || !String(message).trim()) throw badRequest('Isi pengumuman wajib diisi.');
  if (!Array.isArray(targetRoles) || targetRoles.length === 0) {
    throw badRequest('Target role wajib dipilih minimal satu.');
  }
  const invalidRoles = targetRoles.filter((r) => !ALLOWED_TARGET_ROLES.includes(r));
  if (invalidRoles.length > 0) {
    throw badRequest(`Target role harus salah satu dari: ${ALLOWED_TARGET_ROLES.join(', ')}.`);
  }

  const recipientCount = await notifications.notifyRoles(targetRoles, {
    type: 'announcement',
    title: String(title).trim(),
    message: String(message).trim(),
    link: null,
  });

  const announcement = await Announcement.create({
    title: String(title).trim(),
    message: String(message).trim(),
    targetRoles: targetRoles.join(','),
    recipientCount,
    createdBy,
  });

  return serialize(await Announcement.findByPk(announcement.id, { include: [{ model: Admin, as: 'author', attributes: ['id', 'name'] }] }));
}

async function list() {
  const rows = await Announcement.findAll({
    include: [{ model: Admin, as: 'author', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  return rows.map(serialize);
}

module.exports = { create, list, ALLOWED_TARGET_ROLES };