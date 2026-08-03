'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('quotations', 'client_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    await queryInterface.addColumn('quotations', 'project_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'projects', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    // Kolom text lama (client/project) dipertahankan sebagai fallback
    // display untuk quotation yang dibuat sebelum relasi ini ada, dan
    // tetap terisi otomatis dari nama Client/Project saat clientId /
    // projectId dikirim (lihat quotations.service.js).
    await queryInterface.addIndex('quotations', ['client_id']);
    await queryInterface.addIndex('quotations', ['project_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('quotations', ['client_id']);
    await queryInterface.removeIndex('quotations', ['project_id']);
    await queryInterface.removeColumn('quotations', 'client_id');
    await queryInterface.removeColumn('quotations', 'project_id');
  },
};
