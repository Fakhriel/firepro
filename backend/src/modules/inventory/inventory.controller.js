const service = require('./inventory.service');

async function listHandler(req, res, next) {
  try {
    const items = await service.list();
    res.status(200).json({ data: items });
  } catch (err) {
    next(err);
  }
}

async function getByIdHandler(req, res, next) {
  try {
    const item = await service.getById(req.params.id);
    res.status(200).json({ data: item });
  } catch (err) {
    next(err);
  }
}

async function createHandler(req, res, next) {
  try {
    const item = await service.create(req.body);
    res.status(201).json({ data: item, message: 'Barang berhasil ditambahkan.' });
  } catch (err) {
    next(err);
  }
}

async function updateHandler(req, res, next) {
  try {
    const item = await service.update(req.params.id, req.body);
    res.status(200).json({ data: item, message: 'Barang berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
}

async function deleteHandler(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.status(200).json({ message: 'Barang berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, getByIdHandler, createHandler, updateHandler, deleteHandler };