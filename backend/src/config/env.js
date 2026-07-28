require('dotenv').config();

const required = ['DB_NAME', 'DB_USER', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key] || process.env[key].trim() === '');

if (missing.length > 0) {
  console.warn(
    `[env] Peringatan: variabel berikut kosong di .env → ${missing.join(', ')}. ` +
    'Server tetap jalan tapi fitur terkait kemungkinan gagal.'
  );

  if (process.env.NODE_ENV === 'production' && missing.includes('JWT_SECRET')) {
    console.error('[env] FATAL: JWT_SECRET wajib diisi di production. Server dihentikan.');
    process.exit(1);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4321',

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'fireprodb',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },

 
  dbSyncAlter: process.env.DB_SYNC_ALTER === 'true',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  seedAdmin: {
    username: process.env.SEED_ADMIN_USERNAME || 'admin',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
    name: process.env.SEED_ADMIN_NAME || 'Administrator',
  },
};