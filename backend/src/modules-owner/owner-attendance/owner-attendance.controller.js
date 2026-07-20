const service = require('../../modules/attendance/attendance.service');

async function teamHandler(req, res, next) {
  try {
    const { date, role } = req.query;
    if (role && !['supervisor', 'karyawan'].includes(role)) {
      return res.status(400).json({ error: "role harus 'supervisor' atau 'karyawan'." });
    }
    const data = await service.listByDate({ date, role: role || undefined });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { teamHandler };