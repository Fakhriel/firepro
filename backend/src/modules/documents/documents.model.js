const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Project } = require('../projects/projects.model');
const { Admin } = require('../admin-auth/admin.model');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM(
      'quotation',
      'boq',
      'contract',
      'po',
      'drawing',
      'bast',
      'report',
      'invoice',
      'maintenance',
      'other'
    ),
    allowNull: false,
    defaultValue: 'other',
  },
  relatedType: {
    type: DataTypes.ENUM('quotation', 'boq', 'invoice', 'maintenance'),
    allowNull: true,
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mimeType: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  sizeBytes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'documents',
});

Document.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(Document, { foreignKey: 'projectId', as: 'documents' });

Document.belongsTo(Admin, { foreignKey: 'uploadedBy', as: 'uploader' });

module.exports = { Document };