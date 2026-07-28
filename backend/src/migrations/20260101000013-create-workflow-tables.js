'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_assignments', {
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
      technician_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      assigned_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('assigned', 'in_progress', 'done'),
        allowNull: false,
        defaultValue: 'assigned',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('project_assignments', ['project_id']);
    await queryInterface.addIndex('project_assignments', ['technician_id']);
    await queryInterface.addIndex('project_assignments', ['status']);

    await queryInterface.createTable('project_documentation', {
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
      assignment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'project_assignments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      caption: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('project_documentation', ['project_id']);
    await queryInterface.addIndex('project_documentation', ['assignment_id']);

    await queryInterface.createTable('purchase_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      inventory_item_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'inventory_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      item_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      urgency: {
        type: Sequelize.ENUM('low', 'normal', 'urgent'),
        allowNull: false,
        defaultValue: 'normal',
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      requested_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('purchase_requests', ['requested_by']);
    await queryInterface.addIndex('purchase_requests', ['status']);
    await queryInterface.addIndex('purchase_requests', ['project_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('purchase_requests');
    await queryInterface.dropTable('project_documentation');
    await queryInterface.dropTable('project_assignments');
  },
};
