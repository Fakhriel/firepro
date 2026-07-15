'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('maintenance_schedules', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      equipment: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      last_service: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      next_service: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      technician: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'due_soon', 'overdue', 'completed'),
        allowNull: false,
        defaultValue: 'scheduled',
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('maintenance_schedules');
  },
};
