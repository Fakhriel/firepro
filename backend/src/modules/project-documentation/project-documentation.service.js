const { ProjectDocumentation } = require('./project-documentation.model');
const { Admin } = require('../admin-auth/admin.model');

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function serialize(d) {
  const plain = d.toJSON ? d.toJSON() : d;
  return {
    id: String(plain.id),
    projectId: plain.projectId,
    assignmentId: plain.assignmentId,
    uploadedBy: plain.uploadedBy,
    fileUrl: plain.fileUrl,
    caption: plain.caption ?? '',
    createdAt: plain.createdAt,
    uploader: plain.uploader ? { id: plain.uploader.id, name: plain.uploader.name } : undefined,
  };
}

async function upload({ projectId, assignmentId, uploadedBy, fileUrl, caption }) {
  if (!projectId) throw badRequest('Project wajib diisi.');
  if (!fileUrl) throw badRequest('File wajib diupload.');

  const doc = await ProjectDocumentation.create({
    projectId,
    assignmentId: assignmentId || null,
    uploadedBy,
    fileUrl,
    caption: caption ? String(caption).trim() : null,
  });
  return serialize(doc);
}

async function listByProject(projectId) {
  const docs = await ProjectDocumentation.findAll({
    where: { projectId },
    include: [{ model: Admin, as: 'uploader', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  return docs.map(serialize);
}

module.exports = { upload, listByProject };
