'use strict';

// Inventory sebelumnya berbentuk katalog produk e-commerce (price,
// oldPrice, badge "Baru"/"Stok Menipis", variant ala ukuran/warna).
// Diganti jadi stock management murni sesuai brief section 11:
// SKU, kategori fire-safety, unit, lokasi, supplier, harga beli,
// minimum stock, dan riwayat pergerakan stok (in/out/adjustment).
//
// inventory_variants dihapus — stok sekarang dihitung dari SUM
// inventory_stock_movements, bukan angka statis per varian, supaya
// riwayat stok in/out/adjustment (dibutuhkan brief) punya sumber data.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('inventory_items', 'unit', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'pcs',
    });
    await queryInterface.addColumn('inventory_items', 'location', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('inventory_items', 'supplier', {
      type: Sequelize.STRING(150),
      allowNull: true,
    });
    await queryInterface.addColumn('inventory_items', 'min_stock', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.renameColumn('inventory_items', 'price', 'purchase_price');

    await queryInterface.changeColumn('inventory_items', 'category', {
      type: Sequelize.ENUM('fire_alarm', 'hydrant', 'apar', 'sprinkler', 'electrical', 'cable', 'tools', 'other'),
      allowNull: false,
      defaultValue: 'other',
    });

    // Migrasi stok lama: total stok tiap barang (SUM varian) dipindah
    // jadi satu baris "adjustment" awal di stock movement, supaya
    // angka stok tidak hilang saat migrasi.
    await queryInterface.createTable('inventory_stock_movements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      inventory_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'inventory_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('in', 'out', 'adjustment'),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      note: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      recorded_by_admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'admins', key: 'id' },
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
    await queryInterface.addIndex('inventory_stock_movements', ['inventory_item_id']);

    await queryInterface.sequelize.query(`
      INSERT INTO inventory_stock_movements (inventory_item_id, type, quantity, note, created_at, updated_at)
      SELECT v.inventory_item_id, 'adjustment', SUM(v.stock), 'Migrasi stok awal dari sistem lama', NOW(), NOW()
      FROM inventory_variants v
      GROUP BY v.inventory_item_id
      HAVING SUM(v.stock) <> 0
    `);

    await queryInterface.dropTable('inventory_variants');
    await queryInterface.removeColumn('inventory_items', 'old_price');
    await queryInterface.removeColumn('inventory_items', 'badge');
    await queryInterface.removeColumn('inventory_items', 'type');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('inventory_items', 'type', {
      type: Sequelize.ENUM('material', 'peralatan'),
      allowNull: false,
      defaultValue: 'material',
    });
    await queryInterface.addColumn('inventory_items', 'badge', {
      type: Sequelize.ENUM('Baru', 'Stok Menipis', 'Sering Dipakai'),
      allowNull: true,
    });
    await queryInterface.addColumn('inventory_items', 'old_price', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true,
    });

    await queryInterface.createTable('inventory_variants', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      variant: { type: Sequelize.STRING(100), allowNull: false },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      inventory_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'inventory_items', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.dropTable('inventory_stock_movements');
    await queryInterface.changeColumn('inventory_items', 'category', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });
    await queryInterface.renameColumn('inventory_items', 'purchase_price', 'price');
    await queryInterface.removeColumn('inventory_items', 'min_stock');
    await queryInterface.removeColumn('inventory_items', 'supplier');
    await queryInterface.removeColumn('inventory_items', 'location');
    await queryInterface.removeColumn('inventory_items', 'unit');
  },
};
