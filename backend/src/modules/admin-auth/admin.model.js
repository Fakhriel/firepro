const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  
  role: {
    type: DataTypes.ENUM('admin', 'superadmin', 'owner', 'supervisor', 'karyawan'),
    allowNull: false,
    defaultValue: 'admin',
  },
}, {
  tableName: 'admins',
});

module.exports = { Admin };