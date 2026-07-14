const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  changePasswordHandler,
} = require('./admin-auth.controller');
const { requireAdminAuth } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth);

// GET /api/admins?search=
router.get('/', listHandler);
// GET /api/admins/:id
router.get('/:id', getByIdHandler);
// POST /api/admins
router.post('/', createHandler);
// PATCH /api/admins/:id
router.patch('/:id', updateHandler);
// DELETE /api/admins/:id
router.delete('/:id', deleteHandler);
// PATCH /api/admins/:id/password
router.patch('/:id/password', changePasswordHandler);

module.exports = router;