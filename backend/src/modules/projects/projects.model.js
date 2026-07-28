// Tabel projects. baseCost + additionalCost disimpan terpisah (bukan
// contractValue langsung) supaya breakdown di drawer detail
// (project.baseCost / project.additionalCost) selalu konsisten dengan
// totalnya — contractValue dihitung di serializer, bukan kolom sendiri.
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Client } = require('../clients/clients.model');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Kode publik ditampilkan sebagai "Project ID" di tabel & drawer,
  // digenerate otomatis saat create (format PRJ-000001) — lihat
  // projects.service.js.
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  crewSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  baseCost: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0,
  },
  additionalCost: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0,
  },
  paymentRef: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('planning', 'in_progress', 'completed', 'on_hold', 'cancelled'),
    allowNull: false,
    defaultValue: 'planning',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'projects',
});

Project.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Client.hasMany(Project, { foreignKey: 'clientId', as: 'projects' });

module.exports = { Project };