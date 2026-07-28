const service = require('./projects.service');

async function listHandler(req, res, next) {
  try {
    const { search, status } = req.query;
    const projects = await service.list({ search, status });
    res.status(200).json({ data: projects });
  } catch (err) {
    next(err);
  }
}

async function getByIdHandler(req, res, next) {
  try {
    const project = await service.getById(req.params.id);
    res.status(200).json({ data: project });
  } catch (err) {
    next(err);
  }
}

async function createHandler(req, res, next) {
  try {
    const project = await service.create(req.body);
    res.status(201).json({ data: project, message: 'Proyek berhasil dibuat.' });
  } catch (err) {
    next(err);
  }
}

async function updateHandler(req, res, next) {
  try {
    const project = await service.update(req.params.id, req.body);
    res.status(200).json({ data: project, message: 'Proyek berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
}

async function deleteHandler(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.status(200).json({ message: 'Proyek berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, getByIdHandler, createHandler, updateHandler, deleteHandler };