// Tabel quotations. client & project sengaja disimpan sebagai teks
// bebas (bukan FK ke Client/Project) — penawaran sering dibuat untuk
// calon klien/proyek yang belum ada record resminya di sistem. Kalau
// nanti quotation diterima (status accepted), baru dikonversi manual
// jadi Client + Project (di luar scope module ini).
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Quotation = sequelize.define('Quotation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  number: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  client: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  project: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },
  validUntil: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'accepted', 'rejected', 'expired'),
    allowNull: false,
    defaultValue: 'draft',
  },
}, {
  tableName: 'quotations',
});

module.exports = { Quotation };