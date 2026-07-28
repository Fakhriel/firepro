const service = require('./admin-auth.service');

async function loginHandler(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await service.login(username, password);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function meHandler(req, res, next) {
  try {
    const admin = await service.getById(req.admin.id);
    res.status(200).json({ data: admin });
  } catch (err) {
    next(err);
  }
}

async function listHandler(req, res, next) {
  try {
    const { search } = req.query;
    const data = await service.list({ search });
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function getByIdHandler(req, res, next) {
  try {
    const admin = await service.getById(req.params.id);
    res.status(200).json({ data: admin });
  } catch (err) {
    next(err);
  }
}

async function createHandler(req, res, next) {
  try {
    const admin = await service.create(req.body);
    res.status(201).json({ data: admin, message: 'Admin berhasil ditambahkan.' });
  } catch (err) {
    next(err);
  }
}

async function updateHandler(req, res, next) {
  try {
    const admin = await service.update(req.params.id, req.body);
    res.status(200).json({ data: admin, message: 'Admin berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
}

async function deleteHandler(req, res, next) {
  try {
    await service.remove(req.params.id, req.admin.id);
    res.status(200).json({ message: 'Admin berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

async function changePasswordHandler(req, res, next) {
  try {
    await service.changePassword(req.params.id, req.body, req.admin);
    res.status(200).json({ message: 'Password berhasil diganti.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listHandler,
  loginHandler,
  meHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  changePasswordHandler,
};