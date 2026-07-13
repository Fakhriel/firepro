const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin } = require('./admin.model');
const env = require('../../config/env');


const INVALID_CREDENTIALS_MESSAGE = 'Username atau password salah.';

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

module.exports = { login, getById };