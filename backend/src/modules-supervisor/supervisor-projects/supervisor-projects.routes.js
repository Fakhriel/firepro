const express = require('express');
const { listHandler, getByIdHandler, approveProgressHandler } = require('./supervisor-projects.controller');

const router = express.Router();

// GET /api/supervisor/projects
router.get('/', listHandler);
router.get('/:id', getByIdHandler);
// PATCH /api/supervisor/projects/:id/progress — body: { status }
router.patch('/:id/progress', approveProgressHandler);

module.exports = router;
