const { Op } = require('sequelize');
const { BoqItem } = require('./boq.model');
const { Project } = require('../projects/projects.model');
const { Quotation } = require('../quotations/quotations.model');
const { escapeLike } = require('../../utils/escapeLike');
const { buildOrder } = require('../../utils/listQuery');

const CATEGORIES = ['material', 'labor', 'service', 'equipment', 'other'];
const SORTABLE_FIELDS = ['itemName', 'category', 'qty', 'unitPrice', 'sortOrder', 'createdAt'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function notFound(message = 'Item BOQ tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

function serialize(item) {
  const plain = item.toJSON ? item.toJSON() : item;
  const qty = Number(plain.qty);
  const unitPrice = Number(plain.unitPrice);

  return {
    id: plain.id,
    projectId: plain.projectId,
    projectName: plain.project?.name ?? undefined,
    quotationId: plain.quotationId,
    quotationNumber: plain.quotation?.number ?? undefined,
    itemName: plain.itemName,
    description: plain.description ?? '',
    category: plain.category,
    specification: plain.specification ?? '',
    qty,
    unit: plain.unit,
    unitPrice,
    total: qty * unitPrice,
    sortOrder: plain.sortOrder,
    createdAt: plain.createdAt,
  };
}

async function list({ projectId, quotationId, category, search, sortBy = 'sortOrder', sortDir = 'asc' } = {}) {
  const where = {};
  if (projectId) where.projectId = projectId;
  if (quotationId) where.quotationId = quotationId;
  if (category && CATEGORIES.includes(category)) where.category = category;
  if (search) {
    where[Op.or] = [
      { itemName: { [Op.like]: `%${escapeLike(search)}%` } },
      { specification: { [Op.like]: `%${escapeLike(search)}%` } },
    ];
  }

  const items = await BoqItem.findAll({
    where,
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name'] },
      { model: Quotation, as: 'quotation', attributes: ['id', 'number'] },
    ],
    order: buildOrder(sortBy, sortDir, SORTABLE_FIELDS, 'sortOrder'),
  });

  return items.map(serialize);
}

async function summary(projectId) {
  const items = await BoqItem.findAll({ where: { projectId } });
  const totalCost = items.reduce((sum, i) => sum + Number(i.qty) * Number(i.unitPrice), 0);
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items
      .filter((i) => i.category === cat)
      .reduce((sum, i) => sum + Number(i.qty) * Number(i.unitPrice), 0);
    return acc;
  }, {});

  return { projectId: Number(projectId), itemCount: items.length, totalCost, byCategory };
}

async function getById(id) {
  const item = await BoqItem.findByPk(id, {
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name'] },
      { model: Quotation, as: 'quotation', attributes: ['id', 'number'] },
    ],
  });
  if (!item) throw notFound();
  return serialize(item);
}

function validateInput(body, { partial = false } = {}) {
  const { projectId, itemName, qty, unit, unitPrice, category } = body;

  if (!partial || projectId !== undefined) {
    if (!projectId) throw badRequest('projectId wajib diisi.');
  }
  if (!partial || itemName !== undefined) {
    if (!itemName || !String(itemName).trim()) throw badRequest('Nama item wajib diisi.');
  }
  if (!partial || unit !== undefined) {
    if (!unit || !String(unit).trim()) throw badRequest('Satuan (unit) wajib diisi.');
  }
  if (!partial || qty !== undefined) {
    if (qty === undefined || qty === null || Number.isNaN(Number(qty)) || Number(qty) < 0) {
      throw badRequest('qty wajib diisi dan harus angka >= 0.');
    }
  }
  if (!partial || unitPrice !== undefined) {
    if (unitPrice === undefined || unitPrice === null || Number.isNaN(Number(unitPrice)) || Number(unitPrice) < 0) {
      throw badRequest('unitPrice wajib diisi dan harus angka >= 0.');
    }
  }
  if (category !== undefined && !CATEGORIES.includes(category)) {
    throw badRequest(`category harus salah satu dari: ${CATEGORIES.join(', ')}.`);
  }

  return {
    ...(projectId !== undefined && { projectId }),
    ...(body.quotationId !== undefined && { quotationId: body.quotationId || null }),
    ...(itemName !== undefined && { itemName: String(itemName).trim() }),
    ...(body.description !== undefined && { description: body.description ? String(body.description).trim() : null }),
    ...(category !== undefined && { category }),
    ...(body.specification !== undefined && { specification: body.specification || null }),
    ...(qty !== undefined && { qty: Number(qty) }),
    ...(unit !== undefined && { unit: String(unit).trim() }),
    ...(unitPrice !== undefined && { unitPrice: Number(unitPrice) }),
    ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
  };
}

async function assertRelationsExist(payload) {
  if (payload.projectId) {
    const project = await Project.findByPk(payload.projectId);
    if (!project) throw badRequest('projectId tidak valid — proyek tidak ditemukan.');
  }
  if (payload.quotationId) {
    const quotation = await Quotation.findByPk(payload.quotationId);
    if (!quotation) throw badRequest('quotationId tidak valid — penawaran tidak ditemukan.');
  }
}

async function create(body) {
  const payload = validateInput(body);
  await assertRelationsExist(payload);
  const item = await BoqItem.create(payload);
  return getById(item.id);
}

async function update(id, body) {
  const item = await BoqItem.findByPk(id);
  if (!item) throw notFound();

  const payload = validateInput(body, { partial: true });
  await assertRelationsExist(payload);

  await item.update(payload);
  return getById(item.id);
}

async function remove(id) {
  const item = await BoqItem.findByPk(id);
  if (!item) throw notFound();
  await item.destroy();
}

module.exports = { list, summary, getById, create, update, remove };