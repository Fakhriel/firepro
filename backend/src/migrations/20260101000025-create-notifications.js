'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Desain sengaja disederhanakan (fan-out on write, bukan join table
    // baca-status terpisah) — cocok untuk skala tim internal kontraktor
    // (puluhan user, bukan jutaan), sesuai prinsip "jangan overengineer".
    // Broadcast ke banyak orang (mis. pengumuman ke semua Karyawan)
    // artinya satu ROW per penerima, dibuat sekaligus saat notifikasi
    // dikirim — bukan satu row + tabel read-tracking terpisah.
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        // String bebas (bukan ENUM) supaya nambah jenis notifikasi baru
        // nanti tidak perlu migration ubah kolom — cukup pakai value baru.
        // Konvensi: 'task_assigned', 'announcement', 'purchase_request_reviewed',
        // 'daily_report_reviewed', dst.
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      link: {
        // Path relatif frontend (mis. "/employee-technical/my-tasks") supaya
        // klik notifikasi bisa langsung mengarahkan ke halaman terkait.
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex('notifications', ['recipient_id', 'is_read']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
