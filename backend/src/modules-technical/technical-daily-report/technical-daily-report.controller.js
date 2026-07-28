const service = require('../../modules/daily-reports/daily-reports.service');
const documentationService = require('../../modules/project-documentation/project-documentation.service');
const { toPublicUrl } = require('../../utils/uploadStorage');

async function listMineHandler(req, res, next) {
  try {
    const { status } = req.query;
    const data = await service.listByTechnician(req.admin.id, { status });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function createHandler(req, res, next) {
  try {
    const { projectId, assignmentId, reportDate, description, materialsUsed, obstacle } = req.body;
    const report = await service.create({
      technicianId: req.admin.id,
      projectId,
      assignmentId,
      reportDate,
      description,
      materialsUsed,
      obstacle,
    });

    // Foto (opsional) — kalau ada file terupload sekalian dengan laporan,
    // simpan lewat project-documentation supaya konsisten dengan foto
    // dokumentasi lain (semua foto proyek ada di 1 tempat).
    if (req.file && report.projectId) {
      const fileUrl = toPublicUrl('documentation', req.file.filename);
      await documentationService.upload({
        projectId: report.projectId,
        assignmentId: report.assignmentId,
        uploadedBy: req.admin.id,
        fileUrl,
        caption: `Daily report ${report.reportDate}`,
      });
    }

    res.status(201).json({ data: report, message: 'Laporan harian berhasil dikirim.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMineHandler, createHandler };
