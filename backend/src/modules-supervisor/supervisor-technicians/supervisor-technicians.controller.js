const { Admin } = require('../../modules/admin-auth/admin.model');

async function listHandler(req, res, next) {
  try {
    const technicians = await Admin.findAll({
      where: { role: 'karyawan' },
      attributes: ['id', 'username', 'name', 'phone', 'email', 'role'],
      order: [['name', 'ASC']],
    });
    res.status(200).json({ data: technicians });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler };
