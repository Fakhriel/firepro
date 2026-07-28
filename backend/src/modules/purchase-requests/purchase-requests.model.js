const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Admin } = require('../admin-auth/admin.model');
const { Project } = require('../projects/projects.model');
const { InventoryItem } = require('../inventory/inventory.model');

const PurchaseRequest = sequelize.define('PurchaseRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  inventoryItemId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  itemName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  urgency: {
    type: DataTypes.ENUM('low', 'normal', 'urgent'),
    allowNull: false,
    defaultValue: 'normal',
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  requestedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'purchase_requests',
});

PurchaseRequest.belongsTo(Admin, { foreignKey: 'requestedBy', as: 'requester' });
PurchaseRequest.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
PurchaseRequest.belongsTo(InventoryItem, { foreignKey: 'inventoryItemId', as: 'inventoryItem' });

module.exports = { PurchaseRequest };
