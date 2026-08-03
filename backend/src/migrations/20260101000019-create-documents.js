'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM(
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
      related_type: {
        type: Sequelize.ENUM('quotation', 'boq', 'invoice', 'maintenance'),
        allowNull: true,
      },
      related_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      mime_type: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      size_bytes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('documents', ['project_id']);
    await queryInterface.addIndex('documents', ['category']);
    await queryInterface.addIndex('documents', ['related_type', 'related_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('documents');
  },
};
