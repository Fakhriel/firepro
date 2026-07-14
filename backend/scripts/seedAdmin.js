const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/db');
const { Admin } = require('../src/modules/admin-auth/admin.model');
const env = require('../src/config/env');

async function run() {
  await sequelize.authenticate();
  await Admin.sync(); // buat tabel `admins` kalau belum ada

  const existing = await Admin.findOne({ where: { username: env.seedAdmin.username } });
  if (existing) {
    console.log(`[seed:admin] Akun "${env.seedAdmin.username}" sudah ada — tidak dibuat ulang.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(env.seedAdmin.password, 10);
  await Admin.create({
    username: env.seedAdmin.username,
    passwordHash,
    name: env.seedAdmin.name,
    role: 'superadmin',
  });

  console.log(`[seed:admin] Akun admin berhasil dibuat:`);
  console.log(`  username: ${env.seedAdmin.username}`);
  console.log(`  password: ${env.seedAdmin.password}`);
  console.log(`  → segera login lalu ganti password ini.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed:admin] Gagal membuat akun admin:', err.message);
  process.exit(1);
});