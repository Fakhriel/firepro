const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  changePasswordHandler,
  blockSuperadminRole,
  blockSuperadminTarget,
} = require('./owner-users.controller');

const router = express.Router();

// GET /api/owner/users?search= — tabel Users di pages/owner/users.astro.
router.get('/', listHandler);
router.get('/:id', getByIdHandler);
// POST /api/owner/users — Owner menambah user baru dengan role apapun
// KECUALI superadmin (diblok di blockSuperadminRole).
router.post('/', blockSuperadminRole, createHandler);
// PATCH /api/owner/users/:id — ganti nama/username/role. Diblok kalau
// body.role = superadmin ATAU target user yang mau diedit sudah superadmin.
router.patch('/:id', blockSuperadminRole, blockSuperadminTarget, updateHandler);
router.delete('/:id', blockSuperadminTarget, deleteHandler);
router.patch('/:id/password', changePasswordHandler);

module.exports = router;
