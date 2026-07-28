// Model tabel `clients` — data pelanggan FIREPRO (bukan akun login,
// murni data kontak). Nantinya jadi rujukan (clientId) untuk module
// projects, quotations, dan invoices.
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  tableName: 'clients',
});

module.exports = { Client };