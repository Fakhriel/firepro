const { Op } = require('sequelize');
const { Quotation } = require('./quotations.model');
const { escapeLike } = require('../../utils/escapeLike');

const STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function notFound(message = 'Penawaran tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

function serialize(q) {
  const plain = q.toJSON ? q.toJSON() : q;
  return {
    id: String(plain.id),
    number: plain.number,
    client: plain.client,
    project: plain.project,
    description: plain.description ?? '',
    amount: Number(plain.amount),
    validUntil: plain.validUntil,
    status: plain.status,
  };
}

async function list({ search, status } = {}) {
  const where = {};
  if (status && STATUSES.includes(status)) where.status = status;
  if (search) {
    where[Op.or] = [
      { number: { [Op.like]: `%${escapeLike(search)}%` } },
      { client: { [Op.like]: `%${escapeLike(search)}%` } },
    ];
  }

  const quotations = await Quotation.findAll({ where, order: [['createdAt', 'DESC']] });
  return quotations.map(serialize);
}

async function getById(id) {
  const q = await Quotation.findByPk(id);
  if (!q) throw notFound();
  return serialize(q);
}

function validateInput(body, { partial = false } = {}) {
  const { client, project, amount, validUntil, status } = body;

  if (!partial || client !== undefined) {
    if (!client || !String(client).trim()) throw badRequest('Nama klien wajib diisi.');
  }
  if (!partial || project !== undefined) {
    if (!project || !String(project).trim()) throw badRequest('Nama proyek wajib diisi.');
  }
  if (!partial || amount !== undefined) {
    if (amount === undefined || amount === null || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      throw badRequest('Nilai penawaran wajib diisi dan harus lebih dari 0.');
    }
  }
  if (!partial || validUntil !== undefined) {
    if (!validUntil) throw badRequest('Tanggal berlaku wajib diisi.');
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    throw badRequest(`status harus salah satu dari: ${STATUSES.join(', ')}.`);
  }

  return {
    ...(client !== undefined && { client: String(client).trim() }),
    ...(project !== undefined && { project: String(project).trim() }),
    ...(body.description !== undefined && { description: body.description ? String(body.description).trim() : null }),
    ...(amount !== undefined && { amount: Number(amount) }),
    ...(validUntil !== undefined && { validUntil }),
    ...(status !== undefined && { status }),
  };
}

async function create(body) {
  const payload = validateInput(body);

 
  const q = await Quotation.create({
    number: `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'draft',
    ...payload,
  });

  const year = new Date().getFullYear();
  q.number = `QUO/${year}/${String(q.id).padStart(6, '0')}`;
  await q.save();

  return serialize(q);
}

async function update(id, body) {
  const q = await Quotation.findByPk(id);
  if (!q) throw notFound();
  const payload = validateInput(body, { partial: true });
  await q.update(payload);
  return serialize(q);
}

async function remove(id) {
  const q = await Quotation.findByPk(id);
  if (!q) throw notFound();
  await q.destroy();
}

module.exports = { list, getById, create, update, remove };