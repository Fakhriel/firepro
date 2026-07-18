// Reuse penuh admin-auth.service — TIDAK ada endpoint untuk ganti role
// atau lihat/ubah user lain di sini. req.params selalu dipaksa ke
// req.admin.id supaya Teknisi cuma bisa baca/ubah akunnya sendiri.
const authController = require('../../modules/admin-auth/admin-auth.controller');

async function meHandler(req, res, next) {
  return authController.meHandler(req, res, next);
}

// updateHandler generik admin-auth menerima field `role` juga — di sini
// dibatasi supaya Teknisi tidak bisa self-upgrade role lewat body request.
async function updateMeHandler(req, res, next) {
  if (req.body && req.body.role !== undefined) {
    delete req.body.role;
  }
  req.params.id = req.admin.id;
  return authController.updateHandler(req, res, next);
}

async function changeMyPasswordHandler(req, res, next) {
  req.params.id = req.admin.id;
  return authController.changePasswordHandler(req, res, next);
}

module.exports = { meHandler, updateMeHandler, changeMyPasswordHandler };
