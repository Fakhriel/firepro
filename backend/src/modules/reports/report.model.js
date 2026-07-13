// Tabel cost_entries — log biaya manual (HPP, iklan, pengiriman,
// operasional, lain-lain) yang diinput lewat "Input Biaya" di
// reports.astro. Revenue TIDAK disimpan di sini — dihitung langsung
// dari SUM(Invoice.amount) yang status='paid' (lihat reports.service.js),
// supaya tidak ada duplikasi sumber data antara module invoices & reports.
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const CostEntry = sequelize.define('CostEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('hpp', 'ads', 'shipping', 'ops', 'other'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'cost_entries',
});

module.exports = { CostEntry };