const service = require('./quotations.service');

async function listHandler(req, res, next) {
  try {
    const { search, status } = req.query;
    const quotations = await service.list({ search, status });
    res.status(200).json({ data: quotations });
  } catch (err) {
    next(err);
  }
}

async function getByIdHandler(req, res, next) {
  try {
    const quotation = await service.getById(req.params.id);
    res.status(200).json({ data: quotation });
  } catch (err) {
    next(err);
  }
}

async function createHandler(req, res, next) {
  try {
    const quotation = await service.create(req.body);
    res.status(201).json({ data: quotation, message: 'Penawaran berhasil dibuat' });
  } catch (err) {
    next(err);
  }
}

async function updateHandler(req, res, next) {
  try {
    const quotation = await service.update(req.params.id, req.body);
    res.status(200).json({ data: quotation, message: 'Penawaran berhasil diperbarui' });
  } catch (err) {
    next(err);
  }
}

async function deleteHandler(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.status(200).json({ message: 'Penawaran berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, getByIdHandler, createHandler, updateHandler, deleteHandler };