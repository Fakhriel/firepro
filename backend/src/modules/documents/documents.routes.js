const express = require('express');
const {
  listHandler,
  getByIdHandler,
  downloadHandler,
  createHandler,
  deleteHandler,
} = require('./documents.controller');
const { requireAdminAuth, requireRole } = require('../../middleware/auth');
const { makeDocumentUploader } = require('../../utils/uploadStorage');

const router = express.Router();
const upload = makeDocumentUploader('documents');

router.use(requireAdminAuth, requireRole('admin', 'superadmin', 'owner'));

// GET /api/documents/admin?projectId=&category=&relatedType=&relatedId=&search=&sortBy=&sortDir=
router.get('/admin', listHandler);
router.get('/:id', getByIdHandler);
router.get('/:id/download', downloadHandler);
router.post('/', upload.single('file'), createHandler);
router.delete('/:id', deleteHandler);

module.exports = router;
