'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // `purchase_price` adalah hasil rename dari kolom `price` lama
    // (lihat 20260101000018-inventory-stock-management.js), yang
    // aslinya NOT NULL. Tapi sesuai spesifikasi ("Purchase Price
    // optional") dan model saat ini (`purchasePrice: { allowNull:
    // true }`), kolom fisik di DB harus ikut jadi nullable —
    // rename saja tidak mengubah constraint-nya. Tanpa fix ini,
    // SETIAP pembuatan item inventory baru gagal dengan error DB
    // "Column 'purchase_price' cannot be null".
    await queryInterface.changeColumn('inventory_items', 'purchase_price', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('inventory_items', 'purchase_price', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false,
    });
  },
};
