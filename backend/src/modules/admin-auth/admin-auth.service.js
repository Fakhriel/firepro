const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Admin } = require('./admin.model');
const env = require('../../config/env');
const { escapeLike } = require('../../utils/escapeLike');


const INVALID_CREDENTIALS_MESSAGE = 'Username atau password salah.';
const ROLES = ['admin', 'superadmin', 'owner', 'supervisor', 'karyawan'];

async function login(username, password) {
  if (!username || !password) {
    const err = new Error('Username dan password wajib diisi.');
    err.status = 400;
    err.expose = true;
    throw err;
  }

  const admin = await Admin.findOne({ where: { username } });
  if (!admin) {
    const err = new Error(INVALID_CREDENTIALS_MESSAGE);
    err.status = 401;
    err.expose = true;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    const err = new Error(INVALID_CREDENTIALS_MESSAGE);
    err.status = 401;
    err.expose = true;
    throw err;
  }

  const token = jwt.sign(
    { sub: admin.id, username: admin.username, role: admin.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  return {
    token,
    admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role },
  };
}

async function getById(id) {
  const admin = await Admin.findByPk(id);
  if (!admin) {
    const err = new Error('Akun admin tidak ditemukan.');
    err.status = 401;
    err.expose = true;
    throw err;
  }
  return { id: admin.id, username: admin.username, name: admin.name, role: admin.role };
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function forbidden(message) {
  const err = new Error(message);
  err.status = 403;
  err.expose = true;
  return err;
}

function notFound(message = 'Akun admin tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

function serialize(admin) {
  const plain = admin.toJSON ? admin.toJSON() : admin;
  return { id: plain.id, username: plain.username, name: plain.name, role: plain.role };
}

async function list({ search } = {}) {
  const where = {};
  if (search) {
    where[Op.or] = [
      { username: { [Op.like]: `%${escapeLike(search)}%` } },
      { name: { [Op.like]: `%${escapeLike(search)}%` } },
    ];
  }
  const admins = await Admin.findAll({ where, order: [['createdAt', 'DESC']] });
  return admins.map(serialize);
}

async function create(body) {
  const { username, password, name, role } = body;
  if (!username || !String(username).trim()) throw badRequest('Username wajib diisi.');
  if (!password || String(password).length < 6) throw badRequest('Password wajib diisi, minimal 6 karakter.');
  if (!name || !String(name).trim()) throw badRequest('Nama wajib diisi.');
  if (role !== undefined && !ROLES.includes(role)) {
    throw badRequest(`role harus salah satu dari: ${ROLES.join(', ')}.`);
  }

  const existing = await Admin.findOne({ where: { username: String(username).trim() } });
  if (existing) throw badRequest('Username sudah dipakai.');

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await Admin.create({
    username: String(username).trim(),
    passwordHash,
    name: String(name).trim(),
    role: role || 'admin',
  });
  return serialize(admin);
}

async function update(id, body) {
  const admin = await Admin.findByPk(id);
  if (!admin) throw notFound();

  const { username, name, role } = body;
  const payload = {};

  if (username !== undefined) {
    if (!String(username).trim()) throw badRequest('Username tidak boleh kosong.');
    const existing = await Admin.findOne({ where: { username: String(username).trim() } });
    if (existing && existing.id !== admin.id) throw badRequest('Username sudah dipakai.');
    payload.username = String(username).trim();
  }
  if (name !== undefined) {
    if (!String(name).trim()) throw badRequest('Nama tidak boleh kosong.');
    payload.name = String(name).trim();
  }
  if (role !== undefined) {
    if (!ROLES.includes(role)) throw badRequest(`role harus salah satu dari: ${ROLES.join(', ')}.`);
    payload.role = role;
  }

  await admin.update(payload);
  return serialize(admin);
}

async function remove(id, requesterId) {
  if (String(id) === String(requesterId)) {
    throw forbidden('Tidak bisa menghapus akun sendiri.');
  }
  const admin = await Admin.findByPk(id);
  if (!admin) throw notFound();
  await admin.destroy();
}

async function changePassword(id, body, requester) {
  const { currentPassword, newPassword } = body;
  if (!newPassword || String(newPassword).length < 6) {
    throw badRequest('Password baru wajib diisi, minimal 6 karakter.');
  }

  const admin = await Admin.findByPk(id);
  if (!admin) throw notFound();

  const isSelf = String(admin.id) === String(requester.id);
  const isSuperadmin = requester.role === 'superadmin';

  if (!isSelf && !isSuperadmin) {
    throw forbidden('Tidak punya izin mengganti password admin lain.');
  }

  if (isSelf) {
    if (!currentPassword) throw badRequest('Password saat ini wajib diisi.');
    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) throw badRequest('Password saat ini salah.');
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 10);
  await admin.save();
}

module.exports = { login, getById, list, create, update, remove, changePassword, ROLES };