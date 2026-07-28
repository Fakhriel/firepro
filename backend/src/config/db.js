// Instance Sequelize tunggal yang dipakai semua model di seluruh
// module (clients, inventory, invoices, dst). Jangan buat instance
// baru di file lain — import `sequelize` dari sini.
const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.nodeEnv === 'development' ? console.log : false,
  define: {
    // camelCase di JS, snake_case di kolom DB — konvensi umum Sequelize
    underscored: true,
    timestamps: true,
  },
});

// Dipanggil sekali saat server start (lihat server.js). Melempar error
// asli ke pemanggil supaya server.js bisa keluar dengan pesan yang jelas
// kalau DB tidak bisa dihubungi, daripada silent fail.
async function connectDB() {
  await sequelize.authenticate();
}

module.exports = { sequelize, connectDB };