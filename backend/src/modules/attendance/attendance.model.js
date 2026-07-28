const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Admin } = require('../admin-auth/admin.model');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  workDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  checkInAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  checkInLocation: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  checkOutAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  checkOutLocation: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('checked_in', 'checked_out'),
    allowNull: false,
    defaultValue: 'checked_in',
  },
}, {
  tableName: 'attendance',
});

Attendance.belongsTo(Admin, { foreignKey: 'adminId', as: 'Admin' });
Admin.hasMany(Attendance, { foreignKey: 'adminId', as: 'attendanceRecords' });

module.exports = { Attendance };
