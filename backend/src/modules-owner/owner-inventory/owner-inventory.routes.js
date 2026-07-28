const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('../../modules/inventory/inventory.controller');
const purchaseRequestsService = require('../../modules/purchase-requests/purchase-requests.service');

const router = express.Router();

// GET /api/owner/inventory/admin
router.get('/admin', listHandler);

// --- Purchase requests (ditaruh sebelum /:id supaya "requests" tidak
// ketangkep sebagai :id) ---
// GET /api/owner/inventory/requests?status=&projectId=
router.get('/requests', async (req, res, next) => {
  try {
    const { status, projectId } = req.query;
    const data = await purchaseRequestsService.list({ status, projectId });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
});
router.patch('/requests/:id/approve', async (req, res, next) => {
  try {
    const data = await purchaseRequestsService.review(req.params.id, {
      status: 'approved',
      reviewedBy: req.admin.id,
    });
    res.status(200).json({ data, message: 'Permintaan alat disetujui.' });
  } catch (err) {
    next(err);
  }
});
router.patch('/requests/:id/reject', async (req, res, next) => {
  try {
    const data = await purchaseRequestsService.review(req.params.id, {
      status: 'rejected',
      reviewedBy: req.admin.id,
    });
    res.status(200).json({ data, message: 'Permintaan alat ditolak.' });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', getByIdHandler);
router.post('/', createHandler);
router.patch('/:id', updateHandler);
router.delete('/:id', deleteHandler);

module.exports = router;