// Tabel inventory: InventoryItem (barang utama), InventoryImage (foto,
// 1..n per barang), InventoryVariant (varian + stok, 1..n per barang).
// totalStock di response API dihitung dari SUM(InventoryVariant.stock),
// bukan kolom tersendiri di InventoryItem.
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const InventoryItem = sequelize.define('InventoryItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Kode barang ditampilkan di tabel admin (kolom "code"), digenerate
  // otomatis saat create (lihat inventory.service.js) — format
  // INV-000001, bukan diisi manual supaya tidak ada duplikat.
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('material', 'peralatan'),
    allowNull: false,
    defaultValue: 'material',
  },
  price: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },
  oldPrice: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true,
  },
  badge: {
    type: DataTypes.ENUM('Baru', 'Stok Menipis', 'Sering Dipakai'),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'inventory_items',
});

const InventoryImage = sequelize.define('InventoryImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  // Menentukan urutan tampil & foto mana yang dipakai sebagai
  // thumbnail (`image` di AdminInventoryItem) — urutan terkecil menang.
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'inventory_images',
});

const InventoryVariant = sequelize.define('InventoryVariant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  variant: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'inventory_variants',
});

InventoryItem.hasMany(InventoryImage, { foreignKey: 'inventoryItemId', as: 'images', onDelete: 'CASCADE' });
InventoryImage.belongsTo(InventoryItem, { foreignKey: 'inventoryItemId' });

InventoryItem.hasMany(InventoryVariant, { foreignKey: 'inventoryItemId', as: 'variants', onDelete: 'CASCADE' });
InventoryVariant.belongsTo(InventoryItem, { foreignKey: 'inventoryItemId' });

module.exports = { InventoryItem, InventoryImage, InventoryVariant };