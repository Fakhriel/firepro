'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cost_entries', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM('hpp', 'ads', 'shipping', 'ops', 'other'),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      note: {
        type: Sequelize.STRING(255),
        allowNull: true,
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
    await queryInterface.dropTable('cost_entries');
  },
};
