const service = require('../../modules/project-documentation/project-documentation.service');

async function listByProjectHandler(req, res, next) {
  try {
    const data = await service.listByProject(req.params.projectId);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { listByProjectHandler };
