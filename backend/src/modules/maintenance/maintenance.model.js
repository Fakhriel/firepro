const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const MaintenanceSchedule = sequelize.define('MaintenanceSchedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  client: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  equipment: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  lastService: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  nextService: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  technician: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'due_soon', 'overdue', 'completed'),
    allowNull: false,
    defaultValue: 'scheduled',
  },
}, {
  tableName: 'maintenance_schedules',
});

module.exports = { MaintenanceSchedule };