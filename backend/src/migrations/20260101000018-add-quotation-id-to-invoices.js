'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('invoices', 'quotation_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'quotations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('invoices', ['quotation_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('invoices', ['quotation_id']);
    await queryInterface.removeColumn('invoices', 'quotation_id');
  },
};
