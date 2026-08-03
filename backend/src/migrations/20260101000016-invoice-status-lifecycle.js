'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('invoices', 'status', {
      type: Sequelize.ENUM(
        'draft',
        'issued',
        'unpaid',
        'partially_paid',
        'paid',
        'overdue',
        'cancelled',
      ),
      allowNull: false,
      defaultValue: 'draft',
    });

    await queryInterface.addColumn('invoices', 'due_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn('invoices', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.createTable('invoice_payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      invoice_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'invoices',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      paid_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      method: {
        type: Sequelize.ENUM('cash', 'bank_transfer', 'cheque', 'other'),
        allowNull: false,
        defaultValue: 'bank_transfer',
      },
      note: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      recorded_by_admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id',
        },
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

    await queryInterface.addIndex('invoice_payments', ['invoice_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invoice_payments');
    await queryInterface.removeColumn('invoices', 'notes');
    await queryInterface.removeColumn('invoices', 'due_date');
    await queryInterface.changeColumn('invoices', 'status', {
      type: Sequelize.ENUM('pending', 'paid', 'failed', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },
};
