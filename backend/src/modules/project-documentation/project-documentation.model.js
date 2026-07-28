const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Admin } = require('../admin-auth/admin.model');
const { Project } = require('../projects/projects.model');
const { ProjectAssignment } = require('../project-assignments/project-assignments.model');

const ProjectDocumentation = sequelize.define('ProjectDocumentation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  caption: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'project_documentation',
});

ProjectDocumentation.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ProjectDocumentation.belongsTo(Admin, { foreignKey: 'uploadedBy', as: 'uploader' });
ProjectDocumentation.belongsTo(ProjectAssignment, { foreignKey: 'assignmentId', as: 'assignment' });

module.exports = { ProjectDocumentation };
