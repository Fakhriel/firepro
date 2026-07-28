const service = require('./owner-dashboard.service');

async function summaryHandler(req, res, next) {
  try {
    const { period } = req.query;
    const data = await service.getSummary({ period });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { summaryHandler };
