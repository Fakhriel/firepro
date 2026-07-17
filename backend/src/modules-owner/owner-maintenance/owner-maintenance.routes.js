// Reuse penuh maintenance.controller & maintenance.service dari
// modules/maintenance.
const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('../../modules/maintenance/maintenance.controller');

const router = express.Router();

// GET /api/owner/maintenance/admin
router.get('/admin', listHandler);
router.get('/:id', getByIdHandler);
router.post('/', createHandler);
router.patch('/:id', updateHandler);
router.delete('/:id', deleteHandler);

module.exports = router;
