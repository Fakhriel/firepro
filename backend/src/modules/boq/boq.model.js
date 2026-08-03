const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Project } = require('../projects/projects.model');
const { Quotation } = require('../quotations/quotations.model');

const BoqItem = sequelize.define('BoqItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  itemName: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.ENUM('material', 'labor', 'service', 'equipment', 'other'),
    allowNull: false,
    defaultValue: 'material',
  },
  specification: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  qty: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0,
  },
  unit: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'boq_items',
});

BoqItem.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(BoqItem, { foreignKey: 'projectId', as: 'boqItems' });

BoqItem.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });
Quotation.hasMany(BoqItem, { foreignKey: 'quotationId', as: 'boqItems' });

module.exports = { BoqItem };