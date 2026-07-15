const app = require('./app');
const env = require('./config/env');
const { sequelize, connectDB } = require('./config/db');


require('./modules/admin-auth/admin.model');
require('./modules/clients/clients.model');
require('./modules/inventory/inventory.model');
require('./modules/invoices/invoices.model');
require('./modules/projects/projects.model');
require('./modules/quotations/quotations.model');
require('./modules/maintenance/maintenance.model');
require('./modules/reports/report.model');

async function start() {
  try {
    await connectDB();
    console.log('[db] Koneksi database berhasil.');

  
    if (env.dbSyncAlter) {
      await sequelize.sync({ alter: true });
      console.log('[db] DB_SYNC_ALTER=true → sinkronisasi skema (alter) selesai. Ingat buatkan migration formalnya kalau perubahan ini permanen.');
    } else {
      await sequelize.sync();
      console.log('[db] Sinkronisasi skema (tanpa alter) selesai. Perubahan skema dikelola lewat migration — jalankan `npm run db:migrate`.');
    }
  } catch (err) {
    console.error('[db] Gagal konek ke database:', err.message);
    console.error('[db] Cek kembali DB_HOST/DB_NAME/DB_USER/DB_PASSWORD di .env');
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`[server] Berjalan di http://localhost:${env.port}`);
  });
}

start();