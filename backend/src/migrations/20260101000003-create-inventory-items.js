'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_items', {
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
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('material', 'peralatan'),
        allowNull: false,
        defaultValue: 'material',
      },
      price: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      old_price: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
      },
      badge: {
        type: Sequelize.ENUM('Baru', 'Stok Menipis', 'Sering Dipakai'),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    await queryInterface.dropTable('inventory_items');
  },
};
