// Controller tipis — jembatan request/response ke service. Response
// shape ikut konvensi admin-auth: sukses → { data } (+ message untuk
// mutasi), error dilempar ke errorHandler global lewat next(err).
const service = require('./clients.service');

async function listHandler(req, res, next) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await service.list({ search, status, page, limit });
    res.status(200).json({ data: result.data, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

async function getByIdHandler(req, res, next) {
  try {
    const client = await service.getById(req.params.id);
    res.status(200).json({ data: client });
  } catch (err) {
    next(err);
  }
}

async function createHandler(req, res, next) {
  try {
    const client = await service.create(req.body);
    res.status(201).json({ data: client, message: 'Klien berhasil ditambahkan.' });
  } catch (err) {
    next(err);
  }
}

async function updateHandler(req, res, next) {
  try {
    const client = await service.update(req.params.id, req.body);
    res.status(200).json({ data: client, message: 'Klien berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
}

async function deleteHandler(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.status(200).json({ message: 'Klien berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, getByIdHandler, createHandler, updateHandler, deleteHandler };