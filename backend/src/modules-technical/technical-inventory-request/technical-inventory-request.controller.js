const service = require('../../modules/purchase-requests/purchase-requests.service');

async function listMineHandler(req, res, next) {
  try {
    const { status } = req.query;
    const data = await service.list({ status, requestedBy: req.admin.id });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function createHandler(req, res, next) {
  try {
    const { inventoryItemId, itemName, quantity, urgency, note, projectId } = req.body;
    const data = await service.create({
      inventoryItemId,
      itemName,
      quantity,
      urgency,
      note,
      projectId,
      requestedBy: req.admin.id,
    });
    res.status(201).json({ data, message: 'Permintaan alat berhasil diajukan.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMineHandler, createHandler };
