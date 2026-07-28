const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Admin } = require('../admin-auth/admin.model');
const { Project } = require('../projects/projects.model');

const DailyReport = sequelize.define('DailyReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  technicianId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reportDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  materialsUsed: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  obstacle: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('submitted', 'reviewed'),
    allowNull: false,
    defaultValue: 'submitted',
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reviewNote: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'daily_reports',
});

DailyReport.belongsTo(Admin, { foreignKey: 'technicianId', as: 'technician' });
DailyReport.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

module.exports = { DailyReport };
