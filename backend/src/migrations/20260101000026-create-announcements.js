'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tabel ini adalah CATATAN/AUDIT dari pengumuman yang pernah dikirim
    // (siapa kirim apa, ke role mana, kapan) — pengiriman aktualnya ke
    // masing-masing user tetap lewat fan-out ke tabel `notifications`
    // (lihat notifications.service.notifyRoles). Dipisah supaya Owner/
    // Admin punya riwayat pengumuman yang bisa dilihat ulang, terlepas
    // dari status baca/hapus notifikasi individual tiap user.
    await queryInterface.createTable('announcements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      // Disimpan sebagai string dipisah koma (mis. "supervisor,karyawan")
      // — cukup sederhana untuk kebutuhan ini, tidak perlu tabel relasi
      // terpisah untuk sekadar daftar target role.
      target_roles: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      recipient_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('announcements');
  },
};
