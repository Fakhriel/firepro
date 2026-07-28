const express = require('express');
const { makeUploader } = require('../../utils/uploadStorage');
const {
  listMineHandler,
  updateOwnStatusHandler,
  uploadTaskPhotoHandler,
} = require('./technical-tasks.controller');

const upload = makeUploader('documentation');
const router = express.Router();

// GET /api/technical/tasks — daftar tugas milik sendiri.
router.get('/', listMineHandler);
// PATCH /api/technical/tasks/:id/status — body: { status }
router.patch('/:id/status', updateOwnStatusHandler);
// POST /api/technical/tasks/:id/photo — multipart/form-data, field: photo
router.post('/:id/photo', upload.single('photo'), uploadTaskPhotoHandler);

module.exports = router;
