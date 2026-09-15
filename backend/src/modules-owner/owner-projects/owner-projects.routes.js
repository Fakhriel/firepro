
const express = require('express');
const {
  optionsHandler,
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('../../modules/projects/projects.controller');

const router = express.Router();

// GET /api/owner/projects/options?search= — dipakai combobox proyek di
// form Quotation (Owner tidak bisa pakai /api/projects/options karena
// itu di-guard role 'admin' saja — sama seperti kasus /api/clients/options).
router.get('/options', optionsHandler);
// GET /api/owner/projects/admin — samakan path dengan modules/projects
// (frontend admin memanggil /api/projects/admin) supaya konsisten saat
// dashboard/owner nanti di-wire ke endpoint ini.
router.get('/admin', listHandler);
router.get('/:id', getByIdHandler);
router.post('/', createHandler);
router.patch('/:id', updateHandler);
router.delete('/:id', deleteHandler);

module.exports = router;
