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

async function connectDB() {
  await sequelize.authenticate();
}

module.exports = { sequelize, connectDB };
