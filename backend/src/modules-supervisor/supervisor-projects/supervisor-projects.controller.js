const projectsService = require('../../modules/projects/projects.service');

async function listHandler(req, res, next) {
  try {
    const { search, status } = req.query;
    const data = await projectsService.list({ search, status });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function getByIdHandler(req, res, next) {
  try {
    const data = await projectsService.getById(req.params.id);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

// Approve progress proyek — Supervisor menandai proyek naik status
// (mis. planning -> in_progress, in_progress -> completed), reuse
// projects.service.update supaya validasi status tetap konsisten.
async function approveProgressHandler(req, res, next) {
  try {
    const { status } = req.body;
    const data = await projectsService.update(req.params.id, { status });
    res.status(200).json({ data, message: 'Progress proyek berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, getByIdHandler, approveProgressHandler };
