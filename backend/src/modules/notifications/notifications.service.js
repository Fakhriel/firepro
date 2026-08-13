const { Op } = require('sequelize');
const { Notification } = require('./notifications.model');
const { Admin } = require('../admin-auth/admin.model');

function notFound(message = 'Notifikasi tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

function serialize(n) {
  const plain = n.toJSON ? n.toJSON() : n;
  return {
    id: plain.id,
    type: plain.type,
    title: plain.title,
    message: plain.message ?? '',
    link: plain.link ?? null,
    isRead: plain.isRead,
    createdAt: plain.createdAt,
  };
}

// Dipanggil dari modul lain (project-assignments, purchase-requests, dst)
// untuk mengirim notifikasi ke SATU orang tertentu.
async function notifyUser(recipientId, { type, title, message, link }) {
  if (!recipientId || !type || !title) return null;
  const n = await Notification.create({ recipientId, type, title, message: message || null, link: link || null });
  return serialize(n);
}

async function notifyRole(role, { type, title, message, link }) {
  const recipients = await Admin.findAll({ where: { role, isActive: true }, attributes: ['id'] });
  if (recipients.length === 0) return 0;

  await Notification.bulkCreate(
    recipients.map((r) => ({
      recipientId: r.id,
      type,
      title,
      message: message || null,
      link: link || null,
    }))
  );
  return recipients.length;
}

async function notifyRoles(roles, payload) {
  const counts = await Promise.all(roles.map((role) => notifyRole(role, payload)));
  return counts.reduce((sum, c) => sum + c, 0);
}

async function listMine(recipientId, { unreadOnly, limit = 50 } = {}) {
  const where = { recipientId };
  if (unreadOnly) where.isRead = false;

  const notifications = await Notification.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: Math.min(Number(limit) || 50, 100),
  });
  return notifications.map(serialize);
}

async function unreadCount(recipientId) {
  return Notification.count({ where: { recipientId, isRead: false } });
}

async function markRead(id, recipientId) {
  const n = await Notification.findOne({ where: { id, recipientId } });
  if (!n) throw notFound();
  if (!n.isRead) await n.update({ isRead: true });
  return serialize(n);
}

async function markAllRead(recipientId) {
  await Notification.update({ isRead: true }, { where: { recipientId, isRead: false } });
}

async function remove(id, recipientId) {
  const n = await Notification.findOne({ where: { id, recipientId } });
  if (!n) throw notFound();
  await n.destroy();
}

module.exports = { notifyUser, notifyRole, notifyRoles, listMine, unreadCount, markRead, markAllRead, remove };