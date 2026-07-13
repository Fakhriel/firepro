const { Op } = require('sequelize');
const { Project } = require('./projects.model');
const { Client } = require('../clients/clients.model');
const { escapeLike } = require('../../utils/escapeLike');
const { rethrowFriendlyForeignKeyError } = require('../../utils/sequelizeErrors');

const STATUSES = ['planning', 'in_progress', 'completed', 'on_hold', 'cancelled'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function notFound(message = 'Proyek tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

// Bentuk response persis kontrak AdminProject di projects.astro.
function serialize(project) {
  const plain = project.toJSON ? project.toJSON() : project;
  const baseCost = Number(plain.baseCost);
  const additionalCost = Number(plain.additionalCost);

  return {
    id: plain.id,
    projectId: plain.code,
    projectCode: plain.code,
    projectName: plain.name,
    clientId: plain.clientId,
    clientName: plain.client?.name ?? '-',
    clientEmail: plain.client?.email ?? '-',
    location: plain.location,
    category: plain.category,
    crewSize: plain.crewSize,
    baseCost,
    additionalCost,
    contractValue: baseCost + additionalCost,
    paymentRef: plain.paymentRef,
    status: plain.status,
    startDate: plain.startDate,
  };
}

const includeClient = [{ model: Client, as: 'client', attributes: ['id', 'name', 'email'] }];

async function list({ search, status } = {}) {
  const where = {};
  if (status && STATUSES.includes(status)) where.status = status;
  if (search) {
    where[Op.or] = [
      { code: { [Op.like]: `%${escapeLike(search)}%` } },
      { name: { [Op.like]: `%${escapeLike(search)}%` } },
    ];
  }

  const projects = await Project.findAll({
    where,
    include: includeClient,
    order: [['startDate', 'DESC']],
  });
  return projects.map(serialize);
}

async function getById(id) {
  const project = await Project.findByPk(id, { include: includeClient });
  if (!project) throw notFound();
  return serialize(project);
}

async function generateCode() {
  const total = await Project.count();
  return `PRJ-${String(total + 1).padStart(6, '0')}`;
}

function validateInput(body, { partial = false } = {}) {
  const { clientId, name, startDate, status, crewSize, baseCost, additionalCost } = body;

  if (!partial || clientId !== undefined) {
    if (!clientId) throw badRequest('clientId wajib diisi.');
  }
  if (!partial || name !== undefined) {
    if (!name || !String(name).trim()) throw badRequest('Nama proyek wajib diisi.');
  }
  if (!partial || startDate !== undefined) {
    if (!startDate) throw badRequest('startDate wajib diisi.');
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    throw badRequest(`status harus salah satu dari: ${STATUSES.join(', ')}.`);
  }
  if (crewSize !== undefined && (Number.isNaN(Number(crewSize)) || Number(crewSize) < 1)) {
    throw badRequest('crewSize harus angka >= 1.');
  }
  if (baseCost !== undefined && (Number.isNaN(Number(baseCost)) || Number(baseCost) < 0)) {
    throw badRequest('baseCost harus angka >= 0.');
  }
  if (additionalCost !== undefined && (Number.isNaN(Number(additionalCost)) || Number(additionalCost) < 0)) {
    throw badRequest('additionalCost harus angka >= 0.');
  }

  return {
    ...(clientId !== undefined && { clientId }),
    ...(name !== undefined && { name: String(name).trim() }),
    ...(body.location !== undefined && { location: body.location || null }),
    ...(body.category !== undefined && { category: body.category || null }),
    ...(crewSize !== undefined && { crewSize: Number(crewSize) }),
    ...(baseCost !== undefined && { baseCost: Number(baseCost) }),
    ...(additionalCost !== undefined && { additionalCost: Number(additionalCost) }),
    ...(body.paymentRef !== undefined && { paymentRef: body.paymentRef || null }),
    ...(status !== undefined && { status }),
    ...(startDate !== undefined && { startDate }),
  };
}

async function create(body) {
  const payload = validateInput(body);

  const client = await Client.findByPk(payload.clientId);
  if (!client) throw badRequest('clientId tidak valid — klien tidak ditemukan.');

  const code = await generateCode();
  const project = await Project.create({ code, status: 'planning', crewSize: 1, ...payload });
  return getById(project.id);
}

async function update(id, body) {
  const project = await Project.findByPk(id);
  if (!project) throw notFound();

  const payload = validateInput(body, { partial: true });

  if (payload.clientId !== undefined) {
    const client = await Client.findByPk(payload.clientId);
    if (!client) throw badRequest('clientId tidak valid — klien tidak ditemukan.');
  }

  await project.update(payload);
  return getById(project.id);
}

async function remove(id) {
  const project = await Project.findByPk(id);
  if (!project) throw notFound();
  try {
    await project.destroy();
  } catch (err) {
    rethrowFriendlyForeignKeyError(
      err,
      'Project tidak bisa dihapus karena masih punya invoice yang terhubung.'
    );
  }
}

module.exports = { list, getById, create, update, remove };