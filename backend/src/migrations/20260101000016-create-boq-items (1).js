'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('boq_items', {
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
        onDelete: 'RESTRICT',
      },
      quotation_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'quotations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      item_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM('material', 'labor', 'service', 'equipment', 'other'),
        allowNull: false,
        defaultValue: 'material',
      },
      specification: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      qty: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex('boq_items', ['project_id']);
    await queryInterface.addIndex('boq_items', ['quotation_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('boq_items');
  },
};
