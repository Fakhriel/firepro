const service = require('../../modules/attendance/attendance.service');

async function checkInHandler(req, res, next) {
  try {
    const data = await service.checkIn({ adminId: req.admin.id, location: req.body.location });
    res.status(201).json({ data, message: 'Check in berhasil.' });
  } catch (err) {
    next(err);
  }
}

async function checkOutHandler(req, res, next) {
  try {
    const data = await service.checkOut({ adminId: req.admin.id, location: req.body.location });
    res.status(200).json({ data, message: 'Check out berhasil.' });
  } catch (err) {
    next(err);
  }
}

async function todayHandler(req, res, next) {
  try {
    const data = await service.getToday(req.admin.id);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function historyHandler(req, res, next) {
  try {
    const data = await service.listHistory(req.admin.id);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkInHandler, checkOutHandler, todayHandler, historyHandler };
