const service = require('./maintenance.service');

async function listHandler(req, res, next) {
  try {
    const { search, status } = req.query;
    const schedules = await service.list({ search, status });
    res.status(200).json({ data: schedules });
  } catch (err) {
    next(err);
  }
}

async function getByIdHandler(req, res, next) {
  try {
    const schedule = await service.getById(req.params.id);
    res.status(200).json({ data: schedule });
  } catch (err) {
    next(err);
  }
}

async function createHandler(req, res, next) {
  try {
    const schedule = await service.create(req.body);
    res.status(201).json({ data: schedule, message: 'Jadwal maintenance berhasil dibuat' });
  } catch (err) {
    next(err);
  }
}

async function updateHandler(req, res, next) {
  try {
    const schedule = await service.update(req.params.id, req.body);
    res.status(200).json({ data: schedule, message: 'Jadwal berhasil diperbarui' });
  } catch (err) {
    next(err);
  }
}

async function deleteHandler(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.status(200).json({ message: 'Jadwal berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, getByIdHandler, createHandler, updateHandler, deleteHandler };