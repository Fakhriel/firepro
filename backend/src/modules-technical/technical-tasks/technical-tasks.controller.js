const assignmentsService = require('../../modules/project-assignments/project-assignments.service');
const documentationService = require('../../modules/project-documentation/project-documentation.service');
const { toPublicUrl } = require('../../utils/uploadStorage');

async function listMineHandler(req, res, next) {
  try {
    const data = await assignmentsService.listByTechnician(req.admin.id);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

// Teknisi cuma boleh update status tugas MILIK SENDIRI — dicek di sini
// (bukan di service, karena service.updateStatus dipakai bersama oleh
// Supervisor yang boleh update tugas siapa saja).
async function updateOwnStatusHandler(req, res, next) {
  try {
    const assignment = await assignmentsService.getById(req.params.id);
    if (String(assignment.technicianId) !== String(req.admin.id)) {
      const err = new Error('Anda hanya bisa mengubah status tugas milik sendiri.');
      err.status = 403;
      err.expose = true;
      throw err;
    }
    const data = await assignmentsService.updateStatus(req.params.id, req.body.status);
    res.status(200).json({ data, message: 'Status tugas berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
}

// Upload foto pekerjaan untuk 1 tugas tertentu — reuse
// project-documentation, tapi assignmentId WAJIB & harus milik sendiri.
async function uploadTaskPhotoHandler(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error('File foto wajib diupload.');
      err.status = 400;
      err.expose = true;
      throw err;
    }

    const assignment = await assignmentsService.getById(req.params.id);
    if (String(assignment.technicianId) !== String(req.admin.id)) {
      const err = new Error('Anda hanya bisa upload foto untuk tugas milik sendiri.');
      err.status = 403;
      err.expose = true;
      throw err;
    }

    const fileUrl = toPublicUrl('documentation', req.file.filename);
    const data = await documentationService.upload({
      projectId: assignment.projectId,
      assignmentId: assignment.id,
      uploadedBy: req.admin.id,
      fileUrl,
      caption: req.body.caption,
    });

    res.status(201).json({ data, message: 'Foto pekerjaan berhasil diupload.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMineHandler, updateOwnStatusHandler, uploadTaskPhotoHandler };
