const service = require('./boq.service');

async function listHandler(req, res, next) {
  try {
    const { projectId, quotationId, category, search, sortBy, sortDir } = req.query;
    const items = await service.list({ projectId, quotationId, category, search, sortBy, sortDir });
    res.status(200).json({ data: items });
  } catch (err) {
    next(err);
  }
}

async function summaryHandler(req, res, next) {
  try {
    const result = await service.summary(req.params.projectId);
    res.status(200).json({ data: result });
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
    res.status(201).json({ data: item, message: 'Item BOQ berhasil ditambahkan.' });
  } catch (err) {
    next(err);
  }
}

async function updateHandler(req, res, next) {
  try {
    const item = await service.update(req.params.id, req.body);
    res.status(200).json({ data: item, message: 'Item BOQ berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
}

async function deleteHandler(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.status(200).json({ message: 'Item BOQ berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listHandler,
  summaryHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
};