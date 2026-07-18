const service = require('./technical-dashboard.service');

async function summaryHandler(req, res, next) {
  try {
    const data = await service.getSummary({ technicianId: req.admin.id });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { summaryHandler };
