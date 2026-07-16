// Tabel invoices. clientId & projectId FK sungguhan ke Client dan
// Project.
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Client } = require('../clients/clients.model');
const { Project } = require('../projects/projects.model');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  invoiceNumber: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  issuedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'invoices',
});

Invoice.belongsTo(Client, { foreignKey: { name: 'clientId', allowNull: false }, as: 'client' });
Client.hasMany(Invoice, { foreignKey: 'clientId', as: 'invoices' });


Invoice.belongsTo(Project, { foreignKey: { name: 'projectId', allowNull: false }, as: 'project' });
Project.hasMany(Invoice, { foreignKey: 'projectId', as: 'invoices' });

module.exports = { Invoice };
