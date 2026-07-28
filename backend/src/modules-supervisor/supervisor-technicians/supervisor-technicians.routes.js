const express = require('express');
const { listHandler } = require('./supervisor-technicians.controller');

const router = express.Router();

// GET /api/supervisor/technicians — daftar akun role 'karyawan'.
router.get('/', listHandler);

module.exports = router;
