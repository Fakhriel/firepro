// Reuse penuh inventory.controller & inventory.service dari
// modules/inventory (CRUD barang + stok).
//
// CATATAN: fitur "approve pembelian barang" BELUM diimplementasi di sini
// karena tabel purchase_requests belum dibuat (sudah didiskusikan &
// disepakati untuk di-skip di tahap Owner ini, fokus ke modul yang
// datanya sudah ada). Endpoint approve akan ditambahkan sebagai
// tahap terpisah setelah migration purchase_requests dibuat — kemungkinan
// dipakai bersama oleh modules-owner, modules-supervisor, dan
// modules-technical (supervisor/teknisi mengajukan, owner approve).
const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('../../modules/inventory/inventory.controller');

const router = express.Router();

// GET /api/owner/inventory/admin
router.get('/admin', listHandler);
router.get('/:id', getByIdHandler);
router.post('/', createHandler);
router.patch('/:id', updateHandler);
router.delete('/:id', deleteHandler);

module.exports = router;
