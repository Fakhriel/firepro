// Reuse penuh quotations.controller & quotations.service dari
// modules/quotations. Owner boleh lihat & kelola penawaran, tapi TIDAK
// ada endpoint khusus "ubah harga" terpisah — kontrol harga tetap lewat
// field yang sama seperti admin (perubahan harga = update quotation biasa,
// jadi pembatasan "supervisor tidak boleh ubah harga" cukup ditegakkan
// lewat TIDAK memberi supervisor akses ke namespace ini sama sekali).
const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('../../modules/quotations/quotations.controller');

const router = express.Router();

// GET /api/owner/quotations/admin
router.get('/admin', listHandler);
router.get('/:id', getByIdHandler);
router.post('/', createHandler);
router.patch('/:id', updateHandler);
router.delete('/:id', deleteHandler);

module.exports = router;
