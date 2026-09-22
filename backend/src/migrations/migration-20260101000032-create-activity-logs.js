'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'admins', key: 'id' },
        onDelete: 'SET NULL',
      },
      // Snapshot nama+role pelaku pada saat kejadian — tetap terbaca meski
      // akun pelaku belakangan dinonaktifkan/diganti nama.
      actorName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      actorRole: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('activity_logs', ['createdAt']);
    await queryInterface.addIndex('activity_logs', ['entityType', 'entityId']);
    await queryInterface.addIndex('activity_logs', ['actorId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('activity_logs');
  },
};
