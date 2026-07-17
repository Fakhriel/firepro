// Reuse penuh invoices.controller & invoices.service dari modules/invoices.
const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('../../modules/invoices/invoices.controller');

const router = express.Router();

// GET /api/owner/invoices/admin
router.get('/admin', listHandler);
router.get('/:id', getByIdHandler);
router.post('/', createHandler);
router.patch('/:id', updateHandler);
router.delete('/:id', deleteHandler);

module.exports = router;
