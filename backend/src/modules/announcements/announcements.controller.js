const service = require('./announcements.service');

async function createHandler(req, res, next) {
  try {
    const data = await service.create(req.body, req.admin.id);
    res.status(201).json({ data, message: `Pengumuman terkirim ke ${data.recipientCount} orang.` });
  } catch (err) {
    next(err);
  }
}

async function listHandler(req, res, next) {
  try {
    const data = await service.list();
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { createHandler, listHandler };