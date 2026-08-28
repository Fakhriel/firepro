const service = require('./reports.service');

async function listCostsHandler(req, res, next) {
  try {
    const costs = await service.listCosts({ period: req.query.period, projectId: req.query.projectId });
    res.status(200).json({ data: costs });
  } catch (err) {
    next(err);
  }
}

async function createCostHandler(req, res, next) {
  try {
    const cost = await service.createCost(req.body);
    res.status(201).json({ data: cost, message: 'Biaya berhasil disimpan' });
  } catch (err) {
    next(err);
  }
}

async function createCostBreakdownHandler(req, res, next) {
  try {
    const costs = await service.createCostBreakdown(req.body);
    res.status(201).json({ data: costs, message: 'Rincian biaya berhasil disimpan' });
  } catch (err) {
    next(err);
  }
}

async function summaryHandler(req, res, next) {
  try {
    const summary = await service.getSummary({ period: req.query.period });
    res.status(200).json({ data: summary });
  } catch (err) {
    next(err);
  }
}

async function projectRoiHandler(req, res, next) {
  try {
    const roi = await service.getProjectRoi(req.params.projectId);
    res.status(200).json({ data: roi });
  } catch (err) {
    next(err);
  }
}

async function listProjectsRoiHandler(req, res, next) {
  try {
    const data = await service.listProjectsRoi();
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCostsHandler,
  createCostHandler,
  createCostBreakdownHandler,
  summaryHandler,
  projectRoiHandler,
  listProjectsRoiHandler,
};
