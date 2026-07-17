// Reuse penuh projects.controller & projects.service dari modules/projects.
// Owner butuh melihat SEMUA proyek + nilai kontrak (baseCost+additionalCost
// dihitung di serializer service, bukan endpoint terpisah) — sudah otomatis
// ikut karena reuse controller yang sama persis dengan admin.
const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('../../modules/projects/projects.controller');

const router = express.Router();

// GET /api/owner/projects/admin — samakan path dengan modules/projects
// (frontend admin memanggil /api/projects/admin) supaya konsisten saat
// dashboard/owner nanti di-wire ke endpoint ini.
router.get('/admin', listHandler);
router.get('/:id', getByIdHandler);
router.post('/', createHandler);
router.patch('/:id', updateHandler);
router.delete('/:id', deleteHandler);

module.exports = router;
