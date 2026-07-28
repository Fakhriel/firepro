const service = require('../../modules/daily-reports/daily-reports.service');

async function listHandler(req, res, next) {
  try {
    const { projectId, status } = req.query;
    const data = await service.listAll({ projectId, status });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function reviewHandler(req, res, next) {
  try {
    const data = await service.markReviewed(req.params.id, {
      reviewNote: req.body.reviewNote,
      reviewedBy: req.admin.id,
    });
    res.status(200).json({ data, message: 'Laporan ditandai sudah ditinjau.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, reviewHandler };
