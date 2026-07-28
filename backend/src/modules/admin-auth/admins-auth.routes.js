const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  changePasswordHandler,
} = require('./admin-auth.controller');
const { requireAdminAuth, requireSuperadmin } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth);
router.get('/', requireSuperadmin, listHandler);
router.get('/:id', requireSuperadmin, getByIdHandler);
router.post('/', requireSuperadmin, createHandler);
router.patch('/:id', requireSuperadmin, updateHandler);
router.delete('/:id', requireSuperadmin, deleteHandler);
router.patch('/:id/password', changePasswordHandler);
module.exports = router;