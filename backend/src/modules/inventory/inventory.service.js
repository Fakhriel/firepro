// Logic inti module inventory. Item + images + variants disimpan
// dalam 1 transaksi supaya tidak ada barang "yatim" (item tanpa foto/
// varian) kalau salah satu insert gagal di tengah jalan.
const { InventoryItem, InventoryImage, InventoryVariant } = require('./inventory.model');
const { sequelize } = require('../../config/db');

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function notFound(message = 'Barang tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}

// Dipakai untuk list (tabel admin) — ringkas, cuma 1 foto (thumbnail)
// + total stok gabungan semua varian.
function serializeListItem(item) {
  const plain = item.toJSON ? item.toJSON() : item;
  const images = [...(plain.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const variants = plain.variants ?? [];

  return {
    id: String(plain.id),
    code: plain.code,
    name: plain.name,
    category: plain.category,
    type: plain.type,
    price: Number(plain.price),
    oldPrice: plain.oldPrice != null ? Number(plain.oldPrice) : null,
    badge: plain.badge,
    isActive: plain.isActive,
    image: images[0]?.url ?? null,
    totalStock: variants.reduce((sum, v) => sum + v.stock, 0),
  };
}

// Dipakai untuk detail (modal edit) — semua foto + semua varian.
function serializeDetail(item) {
  const base = serializeListItem(item);
  const plain = item.toJSON ? item.toJSON() : item;
  const images = [...(plain.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    ...base,
    description: plain.description,
    images: images.map((img) => img.url),
    variants: (plain.variants ?? []).map((v) => ({ variant: v.variant, stock: v.stock })),
  };
}

const includeAssociations = [
  { model: InventoryImage, as: 'images' },
  { model: InventoryVariant, as: 'variants' },
];

async function list() {
  const items = await InventoryItem.findAll({
    include: includeAssociations,
    order: [['createdAt', 'DESC']],
  });
  return items.map(serializeListItem);
}

async function getById(id) {
  const item = await InventoryItem.findByPk(id, { include: includeAssociations });
  if (!item) throw notFound();
  return serializeDetail(item);
}

function validateInput(body) {
  const { name, category, type, price, description, images, variants } = body;

  if (!name || !String(name).trim()) throw badRequest('Nama barang wajib diisi.');
  if (!category || !String(category).trim()) throw badRequest('Kategori wajib diisi.');
  if (type && !['material', 'peralatan'].includes(type)) throw badRequest('Tipe harus "material" atau "peralatan".');
  if (price === undefined || price === null || Number.isNaN(Number(price)) || Number(price) < 0) {
    throw badRequest('Harga wajib diisi dan harus berupa angka >= 0.');
  }
  if (!description || !String(description).trim()) throw badRequest('Deskripsi wajib diisi.');
  if (!Array.isArray(images) || images.length === 0) throw badRequest('Minimal 1 foto wajib diisi.');
  if (!Array.isArray(variants) || variants.length === 0) throw badRequest('Minimal 1 varian wajib diisi.');
  if (body.badge && !['Baru', 'Stok Menipis', 'Sering Dipakai'].includes(body.badge)) {
    throw badRequest('Badge tidak valid.');
  }

  for (const v of variants) {
    if (!v.variant || !String(v.variant).trim()) throw badRequest('Nama varian tidak boleh kosong.');
  }
}

async function create(body) {
  validateInput(body);

  return sequelize.transaction(async (t) => {
    const item = await InventoryItem.create({
      // Kode sementara unik supaya lolos constraint `unique` sebelum
      // di-update ke format final INV-000001 di bawah (butuh id dulu).
      code: `TMP-${Date.now()}`,
      name: body.name.trim(),
      category: body.category.trim(),
      type: body.type || 'material',
      price: Number(body.price),
      oldPrice: body.oldPrice != null ? Number(body.oldPrice) : null,
      badge: body.badge || null,
      description: body.description.trim(),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    }, { transaction: t });

    item.code = `INV-${String(item.id).padStart(6, '0')}`;
    await item.save({ transaction: t });

    await InventoryImage.bulkCreate(
      body.images.map((url, index) => ({ url, sortOrder: index, inventoryItemId: item.id })),
      { transaction: t }
    );
    await InventoryVariant.bulkCreate(
      body.variants.map((v) => ({ variant: v.variant.trim(), stock: Number(v.stock) || 0, inventoryItemId: item.id })),
      { transaction: t }
    );

    const full = await InventoryItem.findByPk(item.id, { include: includeAssociations, transaction: t });
    return serializeDetail(full);
  });
}

async function update(id, body) {
  validateInput(body);

  return sequelize.transaction(async (t) => {
    const item = await InventoryItem.findByPk(id, { transaction: t });
    if (!item) throw notFound();

    await item.update({
      name: body.name.trim(),
      category: body.category.trim(),
      type: body.type || 'material',
      price: Number(body.price),
      oldPrice: body.oldPrice != null ? Number(body.oldPrice) : null,
      badge: body.badge || null,
      description: body.description.trim(),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : item.isActive,
    }, { transaction: t });

    // Cara paling aman untuk "replace" list foto/varian tanpa harus
    // diff satu-satu di sisi server: hapus semua punya item ini lalu
    // insert ulang dari payload yang dikirim form (form selalu kirim
    // state lengkap, bukan delta — lihat getImagesFromForm/
    // getVariantsFromForm di inventory.astro).
    await InventoryImage.destroy({ where: { inventoryItemId: item.id }, transaction: t });
    await InventoryVariant.destroy({ where: { inventoryItemId: item.id }, transaction: t });

    await InventoryImage.bulkCreate(
      body.images.map((url, index) => ({ url, sortOrder: index, inventoryItemId: item.id })),
      { transaction: t }
    );
    await InventoryVariant.bulkCreate(
      body.variants.map((v) => ({ variant: v.variant.trim(), stock: Number(v.stock) || 0, inventoryItemId: item.id })),
      { transaction: t }
    );

    const full = await InventoryItem.findByPk(item.id, { include: includeAssociations, transaction: t });
    return serializeDetail(full);
  });
}

async function remove(id) {
  const item = await InventoryItem.findByPk(id);
  if (!item) throw notFound();
  // images & variants ikut terhapus lewat FK CASCADE (lihat asosiasi
  // di inventory.model.js).
  await item.destroy();
}

module.exports = { list, getById, create, update, remove };