const service = require('./documents.service');

async function listHandler(req, res, next) {
  try {
    const { projectId, category, relatedType, relatedId, search, sortBy, sortDir } = req.query;
    const documents = await service.list({ projectId, category, relatedType, relatedId, search, sortBy, sortDir });
    res.status(200).json({ data: documents });
  } catch (err) {
    next(err);
  }
}

async function getByIdHandler(req, res, next) {
  try {
    const document = await service.getById(req.params.id);
    res.status(200).json({ data: document });
  } catch (err) {
    next(err);
  }
}

// Preview inline untuk PDF/gambar (Wave 4 #19), download langsung untuk
// tipe lain — sesuai kesepakatan: konversi RVT/BIM tetap jadi extension
// opsional, bukan dependency core.
async function downloadHandler(req, res, next) {
  try {
    const { absolutePath, fileName, mimeType } = await service.getFileForDownload(req.params.id);
    const inlineTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const disposition = inlineTypes.includes(mimeType) ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(absolutePath);
  } catch (err) {
    next(err);
  }
}

async function createHandler(req, res, next) {
  try {
    const document = await service.create(req.body, req.file, req.admin?.id);
    res.status(201).json({ data: document, message: 'Dokumen berhasil diunggah.' });
  } catch (err) {
    next(err);
  }
}

async function deleteHandler(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.status(200).json({ message: 'Dokumen berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, getByIdHandler, downloadHandler, createHandler, deleteHandler };