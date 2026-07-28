const service = require('../../modules/maintenance/maintenance.service');

async function listHandler(req, res, next) {
  try {
    const { search, status } = req.query;
    const data = await service.list({ search, status });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function getByIdHandler(req, res, next) {
  try {
    const data = await service.getById(req.params.id);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

// Assign teknisi ke jadwal maintenance — reuse service.update (kolom
// `technician` di maintenance_schedules cukup nama teks, bukan FK, jadi
// tidak perlu tabel baru).
async function assignTechnicianHandler(req, res, next) {
  try {
    const { technician } = req.body;
    const data = await service.update(req.params.id, { technician });
    res.status(200).json({ data, message: 'Teknisi berhasil ditugaskan ke jadwal maintenance.' });
  } catch (err) {
    next(err);
  }
}

// Tandai jadwal maintenance selesai.
async function completeHandler(req, res, next) {
  try {
    const data = await service.update(req.params.id, { status: 'completed' });
    res.status(200).json({ data, message: 'Jadwal maintenance ditandai selesai.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, getByIdHandler, assignTechnicianHandler, completeHandler };
