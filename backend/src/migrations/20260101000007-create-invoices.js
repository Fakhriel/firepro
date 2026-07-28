'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      invoice_number: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'failed', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      issued_date: {
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
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects',
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

    await queryInterface.addIndex('invoices', ['client_id']);
    await queryInterface.addIndex('invoices', ['project_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invoices');
  },
};
