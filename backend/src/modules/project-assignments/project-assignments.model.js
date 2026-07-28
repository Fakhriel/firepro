const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Admin } = require('../admin-auth/admin.model');
const { Project } = require('../projects/projects.model');

const ProjectAssignment = sequelize.define('ProjectAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  technicianId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('assigned', 'in_progress', 'done'),
    allowNull: false,
    defaultValue: 'assigned',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'project_assignments',
});

ProjectAssignment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ProjectAssignment.belongsTo(Admin, { foreignKey: 'technicianId', as: 'technician' });
Project.hasMany(ProjectAssignment, { foreignKey: 'projectId', as: 'assignments' });

module.exports = { ProjectAssignment };
