// Reuse penuh logic dari modules/admin-auth (list/create/update/delete/
// changePassword) — TIDAK ada duplikasi service. Yang ditambahkan di
// sini cuma 1 guard tambahan yang spesifik untuk Owner: Owner boleh
// mengatur role admin/owner/supervisor/karyawan, tapi TIDAK boleh
// menaikkan/menetapkan role 'superadmin' (role tertinggi tetap
// eksklusif dikelola lewat /api/admins oleh sesama superadmin).
const authController = require('../../modules/admin-auth/admin-auth.controller');
const { Admin } = require('../../modules/admin-auth/admin.model');

function blockSuperadminRole(req, res, next) {
  if (req.body && req.body.role === 'superadmin') {
    return res.status(403).json({ error: 'Owner tidak diizinkan menetapkan role superadmin.' });
  }
  next();
}

// Selain tidak boleh MENETAPKAN role superadmin, Owner juga tidak boleh
// mengubah/menghapus akun yang SUDAH berrole superadmin — supaya akun
// superadmin cuma bisa dikelola sesama superadmin lewat /api/admins.
async function blockSuperadminTarget(req, res, next) {
  try {
    const target = await Admin.findByPk(req.params.id);
    if (target && target.role === 'superadmin') {
      return res.status(403).json({ error: 'Owner tidak diizinkan mengubah/menghapus akun superadmin.' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listHandler: authController.listHandler,
  getByIdHandler: authController.getByIdHandler,
  createHandler: authController.createHandler,
  updateHandler: authController.updateHandler,
  deleteHandler: authController.deleteHandler,
  changePasswordHandler: authController.changePasswordHandler,
  blockSuperadminRole,
  blockSuperadminTarget,
};
