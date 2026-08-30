const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Admin } = require('../admin-auth/admin.model');

const Announcement = sequelize.define(
  'Announcement',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    targetRoles: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'target_roles',
    },
    recipientCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'recipient_count',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true, 
                       
      field: 'created_by',
    },
  },
  {
    tableName: 'announcements',
    underscored: true,
  }
);

Announcement.belongsTo(Admin, { foreignKey: 'createdBy', as: 'author' });

module.exports = { Announcement };
