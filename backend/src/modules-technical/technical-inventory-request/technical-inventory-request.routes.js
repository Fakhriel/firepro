// TIDAK expose lihat katalog/stok inventory sama sekali (beda dengan
// Supervisor yang boleh lihat stok read-only) — sesuai spesifikasi awal:
// Teknisi Lapangan cuma "request alat", tidak "melihat client/invoice/
// stok gudang". Kalau nanti dibutuhkan lihat stok, tinggal tambah
// GET /admin di sini reuse dari modules/inventory seperti Supervisor.
const express = require('express');
const { listMineHandler, createHandler } = require('./technical-inventory-request.controller');

const router = express.Router();

// GET /api/technical/inventory-request — riwayat request milik sendiri.
router.get('/', listMineHandler);
// POST /api/technical/inventory-request
router.post('/', createHandler);

module.exports = router;
