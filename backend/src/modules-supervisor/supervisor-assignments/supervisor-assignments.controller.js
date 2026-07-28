const service = require('../../modules/project-assignments/project-assignments.service');

async function listHandler(req, res, next) {
  try {
    const { projectId, technicianId, status } = req.query;
    const data = await service.list({ projectId, technicianId, status });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function createHandler(req, res, next) {
  try {
    const { projectId, technicianId, notes } = req.body;
    const data = await service.create({ projectId, technicianId, assignedBy: req.admin.id, notes });
    res.status(201).json({ data, message: 'Teknisi berhasil ditugaskan.' });
  } catch (err) {
    next(err);
  }
}

async function updateHandler(req, res, next) {
  try {
    const { notes, technicianId } = req.body;
    const data = await service.update(req.params.id, { notes, technicianId });
    res.status(200).json({ data, message: 'Penugasan berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
}

async function updateStatusHandler(req, res, next) {
  try {
    const data = await service.updateStatus(req.params.id, req.body.status);
    res.status(200).json({ data, message: 'Status penugasan berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
}

async function deleteHandler(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.status(200).json({ message: 'Penugasan berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, createHandler, updateHandler, updateStatusHandler, deleteHandler };
