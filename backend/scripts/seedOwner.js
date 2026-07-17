const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/db');
const { Admin } = require('../src/modules/admin-auth/admin.model');
const USERNAME = process.env.SEED_OWNER_USERNAME || 'owner';
const PASSWORD = process.env.SEED_OWNER_PASSWORD || 'owner123';
const NAME = process.env.SEED_OWNER_NAME || 'Pemilik FIREPRO';

async function run() {
  await sequelize.authenticate();
  await Admin.sync(); 

  const existing = await Admin.findOne({ where: { username: USERNAME } });
  if (existing) {
    console.log(`[seed:owner] Akun "${USERNAME}" sudah ada — tidak dibuat ulang.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await Admin.create({
    username: USERNAME,
    passwordHash,
    name: NAME,
    role: 'owner',
  });

  console.log('[seed:owner] Akun owner berhasil dibuat:');
  console.log(`  username: ${USERNAME}`);
  console.log(`  password: ${PASSWORD}`);
  console.log('  → login lewat POST /api/admin-auth/login, lalu pakai token untuk /api/owner/*.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed:owner] Gagal membuat akun owner:', err.message);
  process.exit(1);
});
