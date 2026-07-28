const express = require('express');
const { listByProjectHandler } = require('./supervisor-documentation.controller');

const router = express.Router();

// GET /api/supervisor/documentation/project/:projectId — foto dokumentasi per proyek.
router.get('/project/:projectId', listByProjectHandler);

module.exports = router;
