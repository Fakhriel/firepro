const { PurchaseRequest } = require('./purchase-requests.model');
const { Admin } = require('../admin-auth/admin.model');
const { Project } = require('../projects/projects.model');
const { InventoryItem } = require('../inventory/inventory.model');

const URGENCIES = ['low', 'normal', 'urgent'];
const STATUSES = ['pending', 'approved', 'rejected'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function notFound(message = 'Permintaan tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

const includeAll = [
  { model: Admin, as: 'requester', attributes: ['id', 'name'] },
  { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
  { model: InventoryItem, as: 'inventoryItem', attributes: ['id', 'name', 'code'] },
];

function serialize(p) {
  const plain = p.toJSON ? p.toJSON() : p;
  return {
    id: String(plain.id),
    inventoryItemId: plain.inventoryItemId,
    itemName: plain.itemName ?? (plain.inventoryItem ? plain.inventoryItem.name : ''),
    quantity: plain.quantity,
    urgency: plain.urgency,
    note: plain.note ?? '',
    projectId: plain.projectId,
    requestedBy: plain.requestedBy,
    status: plain.status,
    reviewedBy: plain.reviewedBy,
    reviewedAt: plain.reviewedAt,
    requester: plain.requester ? { id: plain.requester.id, name: plain.requester.name } : undefined,
    project: plain.project ? { id: plain.project.id, name: plain.project.name, code: plain.project.code } : undefined,
  };
}

async function list({ status, requestedBy, projectId } = {}) {
  const where = {};
  if (status && STATUSES.includes(status)) where.status = status;
  if (requestedBy) where.requestedBy = requestedBy;
  if (projectId) where.projectId = projectId;

  const rows = await PurchaseRequest.findAll({ where, include: includeAll, order: [['createdAt', 'DESC']] });
  return rows.map(serialize);
}

async function create({ inventoryItemId, itemName, quantity, urgency, note, projectId, requestedBy }) {
  if (!inventoryItemId && !(itemName && String(itemName).trim())) {
    throw badRequest('Pilih barang dari inventory atau isi nama barang.');
  }
  if (urgency && !URGENCIES.includes(urgency)) {
    throw badRequest(`urgency harus salah satu dari: ${URGENCIES.join(', ')}.`);
  }

  const p = await PurchaseRequest.create({
    inventoryItemId: inventoryItemId || null,
    itemName: itemName ? String(itemName).trim() : null,
    quantity: quantity ? Number(quantity) : 1,
    urgency: urgency || 'normal',
    note: note ? String(note).trim() : null,
    projectId: projectId || null,
    requestedBy,
    status: 'pending',
  });
  return getById(p.id);
}

async function getById(id) {
  const p = await PurchaseRequest.findByPk(id, { include: includeAll });
  if (!p) throw notFound();
  return serialize(p);
}

async function review(id, { status, reviewedBy }) {
  if (!['approved', 'rejected'].includes(status)) {
    throw badRequest('status review harus approved atau rejected.');
  }
  const p = await PurchaseRequest.findByPk(id);
  if (!p) throw notFound();

  await p.update({ status, reviewedBy, reviewedAt: new Date() });
  return getById(id);
}

module.exports = { list, create, getById, review };
