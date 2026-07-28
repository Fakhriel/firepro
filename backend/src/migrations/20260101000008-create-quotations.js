'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quotations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      number: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      client: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      project: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      valid_until: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('draft', 'sent', 'accepted', 'rejected', 'expired'),
        allowNull: false,
        defaultValue: 'draft',
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
    await queryInterface.dropTable('quotations');
  },
};
