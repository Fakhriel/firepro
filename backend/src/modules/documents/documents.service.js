const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { Document } = require('./documents.model');
const { Project } = require('../projects/projects.model');
const { Admin } = require('../admin-auth/admin.model');
const { escapeLike } = require('../../utils/escapeLike');
const { buildOrder } = require('../../utils/listQuery');
const { UPLOADS_ROOT } = require('../../utils/uploadStorage');

const CATEGORIES = [
  'quotation', 'boq', 'contract', 'po', 'drawing',
  'bast', 'report', 'invoice', 'maintenance', 'other',
];
const RELATED_TYPES = ['quotation', 'boq', 'invoice', 'maintenance'];
const SORTABLE_FIELDS = ['title', 'category', 'sizeBytes', 'createdAt'];
const FOLDER = 'documents';

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function notFound(message = 'Dokumen tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

function serialize(doc) {
  const plain = doc.toJSON ? doc.toJSON() : doc;
  return {
    id: plain.id,
    projectId: plain.projectId,
    projectName: plain.project?.name ?? undefined,
    title: plain.title,
    category: plain.category,
    relatedType: plain.relatedType,
    relatedId: plain.relatedId,
    fileName: plain.fileName,
    mimeType: plain.mimeType,
    sizeBytes: plain.sizeBytes,
    uploadedBy: plain.uploader?.username ?? undefined,
    createdAt: plain.createdAt,
    downloadUrl: `/api/documents/${plain.id}/download`,
  };
}

const includeDefault = [
  { model: Project, as: 'project', attributes: ['id', 'name'] },
  { model: Admin, as: 'uploader', attributes: ['id', 'username'] },
];

async function list({ projectId, category, relatedType, relatedId, search, sortBy = 'createdAt', sortDir = 'desc' } = {}) {
  const where = {};
  if (projectId) where.projectId = projectId;
  if (category && CATEGORIES.includes(category)) where.category = category;
  if (relatedType && RELATED_TYPES.includes(relatedType)) where.relatedType = relatedType;
  if (relatedId) where.relatedId = relatedId;
  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${escapeLike(search)}%` } },
      { fileName: { [Op.like]: `%${escapeLike(search)}%` } },
    ];
  }

  const documents = await Document.findAll({
    where,
    include: includeDefault,
    order: buildOrder(sortBy, sortDir, SORTABLE_FIELDS, 'createdAt'),
  });

  return documents.map(serialize);
}

async function getById(id) {
  const doc = await Document.findByPk(id, { include: includeDefault });
  if (!doc) throw notFound();
  return serialize(doc);
}

async function getFileForDownload(id) {
  const doc = await Document.findByPk(id);
  if (!doc) throw notFound();

  const absolutePath = path.join(UPLOADS_ROOT, FOLDER, path.basename(doc.filePath));
  if (!fs.existsSync(absolutePath)) {
    throw notFound('File dokumen tidak ditemukan di storage.');
  }

  return { absolutePath, fileName: doc.fileName, mimeType: doc.mimeType };
}

async function create({ projectId, title, category, relatedType, relatedId }, file, uploadedBy) {
  if (!projectId) throw badRequest('projectId wajib diisi.');
  if (!file) throw badRequest('File dokumen wajib diunggah.');
  if (category && !CATEGORIES.includes(category)) {
    throw badRequest(`category harus salah satu dari: ${CATEGORIES.join(', ')}.`);
  }
  if (relatedType && !RELATED_TYPES.includes(relatedType)) {
    throw badRequest(`relatedType harus salah satu dari: ${RELATED_TYPES.join(', ')}.`);
  }

  const project = await Project.findByPk(projectId);
  if (!project) throw badRequest('projectId tidak valid — proyek tidak ditemukan.');

  const doc = await Document.create({
    projectId,
    title: title && String(title).trim() ? String(title).trim() : file.originalname,
    category: category || 'other',
    relatedType: relatedType || null,
    relatedId: relatedId || null,
    fileName: file.originalname,
    filePath: file.filename,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    uploadedBy: uploadedBy || null,
  });

  return getById(doc.id);
}

async function remove(id) {
  const doc = await Document.findByPk(id);
  if (!doc) throw notFound();

  const absolutePath = path.join(UPLOADS_ROOT, FOLDER, path.basename(doc.filePath));
  await doc.destroy();

  if (fs.existsSync(absolutePath)) {
    fs.unlink(absolutePath, () => {});
  }
}

module.exports = { list, getById, getFileForDownload, create, remove, CATEGORIES, RELATED_TYPES };