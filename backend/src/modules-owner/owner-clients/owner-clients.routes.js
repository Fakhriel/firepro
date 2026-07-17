// Reuse penuh clients.controller & clients.service dari modules/clients —
// data Owner harus identik dengan admin, cuma beda namespace route
// (/api/owner/clients) + guard role owner (dipasang di owner.routes.js).
const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('../../modules/clients/clients.controller');

const router = express.Router();

// GET /api/owner/clients?search=&status=&page=&limit=
router.get('/', listHandler);
// GET /api/owner/clients/:id
router.get('/:id', getByIdHandler);
// POST /api/owner/clients
router.post('/', createHandler);
// PATCH /api/owner/clients/:id
router.patch('/:id', updateHandler);
// DELETE /api/owner/clients/:id
router.delete('/:id', deleteHandler);

module.exports = router;
