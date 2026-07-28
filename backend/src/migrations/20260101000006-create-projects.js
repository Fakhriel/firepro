'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      crew_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      base_cost: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      additional_cost: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      payment_ref: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('planning', 'in_progress', 'completed', 'on_hold', 'cancelled'),
        allowNull: false,
        defaultValue: 'planning',
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

    await queryInterface.addIndex('projects', ['client_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('projects');
  },
};
