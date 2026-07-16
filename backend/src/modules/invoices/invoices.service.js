const { Op } = require('sequelize');
const { Invoice } = require('./invoices.model');
const { Client } = require('../clients/clients.model');
const { Project } = require('../projects/projects.model');
const { escapeLike } = require('../../utils/escapeLike');

const STATUSES = ['pending', 'paid', 'failed', 'expired', 'cancelled'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function notFound(message = 'Invoice tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

function serialize(invoice) {
  const plain = invoice.toJSON ? invoice.toJSON() : invoice;
  return {
    id: plain.id,
    invoiceNumber: plain.invoiceNumber,
    projectId: plain.projectId != null ? String(plain.projectId) : '-',
    amount: Number(plain.amount),
    status: plain.status,
    issuedDate: plain.issuedDate,
    clientId: plain.clientId,
    clientName: plain.client?.name ?? '-',
  };
}

async function list({ search, status } = {}) {
  const where = {};

  if (status && STATUSES.includes(status)) {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      { invoiceNumber: { [Op.like]: `%${escapeLike(search)}%` } },
    ];
  }

  const invoices = await Invoice.findAll({
    where,
    include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
    order: [['issuedDate', 'DESC']],
  });

  return invoices.map(serialize);
}

async function getById(id) {
  const invoice = await Invoice.findByPk(id, {
    include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
  });
  if (!invoice) throw notFound();
  return serialize(invoice);
}

function validateInput(body, { partial = false } = {}) {
  const { clientId, projectId, amount, status, issuedDate } = body;

  if (!partial || clientId !== undefined) {
    if (!clientId) throw badRequest('clientId wajib diisi.');
  }
  if (!partial || projectId !== undefined) {
    if (!projectId) throw badRequest('projectId wajib diisi.');
  }
  if (!partial || amount !== undefined) {
    if (amount === undefined || amount === null || Number.isNaN(Number(amount)) || Number(amount) < 0) {
      throw badRequest('amount wajib diisi dan harus angka >= 0.');
    }
  }
  if (!partial || issuedDate !== undefined) {
    if (!issuedDate) throw badRequest('issuedDate wajib diisi.');
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    throw badRequest(`status harus salah satu dari: ${STATUSES.join(', ')}.`);
  }

  return {
    ...(clientId !== undefined && { clientId }),
    ...(projectId !== undefined && { projectId }),
    ...(amount !== undefined && { amount: Number(amount) }),
    ...(status !== undefined && { status }),
    ...(issuedDate !== undefined && { issuedDate }),
  };
}

async function create(body) {
  const payload = validateInput(body);

  const client = await Client.findByPk(payload.clientId);
  if (!client) throw badRequest('clientId tidak valid — klien tidak ditemukan.');

  if (payload.projectId) {
    const project = await Project.findByPk(payload.projectId);
    if (!project) throw badRequest('projectId tidak valid — proyek tidak ditemukan.');
  }


  const invoice = await Invoice.create({
    invoiceNumber: `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    ...payload,
  });

  const year = new Date().getFullYear();
  invoice.invoiceNumber = `INV/${year}/${String(invoice.id).padStart(6, '0')}`;
  await invoice.save();

  return getById(invoice.id);
}

async function update(id, body) {
  const invoice = await Invoice.findByPk(id);
  if (!invoice) throw notFound();

  const payload = validateInput(body, { partial: true });

  if (payload.clientId !== undefined) {
    const client = await Client.findByPk(payload.clientId);
    if (!client) throw badRequest('clientId tidak valid — klien tidak ditemukan.');
  }

  if (payload.projectId) {
    const project = await Project.findByPk(payload.projectId);
    if (!project) throw badRequest('projectId tidak valid — proyek tidak ditemukan.');
  }

  await invoice.update(payload);
  return getById(invoice.id);
}

async function remove(id) {
  const invoice = await Invoice.findByPk(id);
  if (!invoice) throw notFound();
  await invoice.destroy();
}

module.exports = { list, getById, create, update, remove };
