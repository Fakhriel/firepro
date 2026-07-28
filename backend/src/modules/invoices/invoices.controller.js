const service = require('./invoices.service');

async function listHandler(req, res, next) {
  try {
    const { search, status } = req.query;
    const invoices = await service.list({ search, status });
    res.status(200).json({ data: invoices });
  } catch (err) {
    next(err);
  }
}

async function getByIdHandler(req, res, next) {
  try {
    const invoice = await service.getById(req.params.id);
    res.status(200).json({ data: invoice });
  } catch (err) {
    next(err);
  }
}

async function createHandler(req, res, next) {
  try {
    const invoice = await service.create(req.body);
    res.status(201).json({ data: invoice, message: 'Invoice berhasil dibuat.' });
  } catch (err) {
    next(err);
  }
}

async function updateHandler(req, res, next) {
  try {
    const invoice = await service.update(req.params.id, req.body);
    res.status(200).json({ data: invoice, message: 'Invoice berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
}

async function deleteHandler(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.status(200).json({ message: 'Invoice berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, getByIdHandler, createHandler, updateHandler, deleteHandler };