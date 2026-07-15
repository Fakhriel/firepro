const { Op } = require('sequelize');
const { Client } = require('./clients.model');
const { Project } = require('../projects/projects.model');
const { escapeLike } = require('../../utils/escapeLike');
const { rethrowFriendlyForeignKeyError } = require('../../utils/sequelizeErrors');

function serializeClient(client, totalProjects = 0) {
  const plain = client.toJSON ? client.toJSON() : client;
  return {
    id: plain.id,
    name: plain.name,
    email: plain.email,
    phone: plain.phone,
    address: plain.address,
    status: plain.status,
    createdAt: plain.createdAt,
    totalProjects,
  };
}

async function countProjectsByClientIds(clientIds) {
  if (clientIds.length === 0) return new Map();
  const rows = await Project.findAll({
    attributes: ['clientId', [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'total']],
    where: { clientId: clientIds },
    group: ['clientId'],
    raw: true,
  });
  return new Map(rows.map((r) => [r.clientId, Number(r.total)]));
}

async function list({ search, status, page = 1, limit = 20 } = {}) {
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${escapeLike(search)}%` } },
      { email: { [Op.like]: `%${escapeLike(search)}%` } },
    ];
  }

  if (status === 'active' || status === 'inactive') {
    where.status = status;
  }

  const pageNum = Math.max(1, Number(page) || 1);
  
  const rawLimit = limit === undefined ? 20 : Number(limit);
  const limitNum = Math.min(100, Math.max(1, Number.isNaN(rawLimit) ? 20 : rawLimit));

  const { rows, count } = await Client.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset: (pageNum - 1) * limitNum,
  });

  const projectCounts = await countProjectsByClientIds(rows.map((r) => r.id));

  return {
    data: rows.map((r) => serializeClient(r, projectCounts.get(r.id) ?? 0)),
    meta: {
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(count / limitNum)),
    },
  };
}

async function getById(id) {
  const client = await Client.findByPk(id);
  if (!client) {
    const err = new Error('Klien tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  const totalProjects = await Project.count({ where: { clientId: id } });
  return serializeClient(client, totalProjects);
}

function validateInput(body, { partial = false } = {}) {
  const { name, email, phone, address, status } = body;

  if (!partial || name !== undefined) {
    if (!name || !String(name).trim()) {
      const err = new Error('Nama klien wajib diisi.');
      err.status = 400;
      err.expose = true;
      throw err;
    }
  }

  if (status !== undefined && !['active', 'inactive'].includes(status)) {
    const err = new Error('Status harus "active" atau "inactive".');
    err.status = 400;
    err.expose = true;
    throw err;
  }

  return {
    ...(name !== undefined && { name: String(name).trim() }),
    ...(email !== undefined && { email: email ? String(email).trim() : null }),
    ...(phone !== undefined && { phone: phone ? String(phone).trim() : null }),
    ...(address !== undefined && { address: address ? String(address).trim() : null }),
    ...(status !== undefined && { status }),
  };
}

async function create(body) {
  const payload = validateInput(body);
  const client = await Client.create({ status: 'active', ...payload });
  return serializeClient(client);
}

async function update(id, body) {
  const client = await Client.findByPk(id);
  if (!client) {
    const err = new Error('Klien tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  const payload = validateInput(body, { partial: true });
  await client.update(payload);
  const totalProjects = await Project.count({ where: { clientId: id } });
  return serializeClient(client, totalProjects);
}

async function remove(id) {
  const client = await Client.findByPk(id);
  if (!client) {
    const err = new Error('Klien tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  try {
    await client.destroy();
  } catch (err) {
    rethrowFriendlyForeignKeyError(
      err,
      'Klien tidak bisa dihapus karena masih punya project atau invoice yang terhubung.'
    );
  }
}

module.exports = { list, getById, create, update, remove };