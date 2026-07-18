const express = require('express');
const { makeUploader } = require('../../utils/uploadStorage');
const { listMineHandler, createHandler } = require('./technical-daily-report.controller');

const upload = makeUploader('documentation');
const router = express.Router();

// GET /api/technical/daily-report — riwayat laporan milik sendiri.
router.get('/', listMineHandler);
// POST /api/technical/daily-report — multipart/form-data (field foto
// opsional: "photo") + projectId?, assignmentId?, reportDate?,
// description, materialsUsed?, obstacle?.
router.post('/', upload.single('photo'), createHandler);

module.exports = router;
