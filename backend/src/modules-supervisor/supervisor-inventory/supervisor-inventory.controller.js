const inventoryService = require('../../modules/inventory/inventory.service');
const purchaseRequestsService = require('../../modules/purchase-requests/purchase-requests.service');

// Read-only — Supervisor cuma boleh lihat stok, tidak boleh CRUD inventory.
async function listInventoryHandler(req, res, next) {
  try {
    const { search } = req.query;
    const data = await inventoryService.list({ search });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function listRequestsHandler(req, res, next) {
  try {
    const { status, projectId } = req.query;
    const data = await purchaseRequestsService.list({ status, projectId });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function approveRequestHandler(req, res, next) {
  try {
    const data = await purchaseRequestsService.review(req.params.id, {
      status: 'approved',
      reviewedBy: req.admin.id,
    });
    res.status(200).json({ data, message: 'Permintaan alat disetujui.' });
  } catch (err) {
    next(err);
  }
}

async function rejectRequestHandler(req, res, next) {
  try {
    const data = await purchaseRequestsService.review(req.params.id, {
      status: 'rejected',
      reviewedBy: req.admin.id,
    });
    res.status(200).json({ data, message: 'Permintaan alat ditolak.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listInventoryHandler, listRequestsHandler, approveRequestHandler, rejectRequestHandler };
