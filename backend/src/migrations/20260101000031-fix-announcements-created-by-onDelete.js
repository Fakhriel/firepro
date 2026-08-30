'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Root cause bug "hapus akun error 500" (QA Round 3, laporan Owner):
    // dari 13 foreign key yang menunjuk ke tabel `admins`, cuma
    // `announcements.created_by` yang dipasang ON DELETE RESTRICT.
    // Begitu akun yang mau dihapus pernah bikin 1 pengumuman saja,
    // MySQL menolak DELETE-nya. 12 FK lain ke `admins` (attendance,
    // daily_reports, project_assignments, dst) sudah pakai CASCADE
    // atau SET NULL — migration ini menyamakan announcements dengan
    // pola itu: riwayat pengumuman tetap ada, "siapa pengirimnya"
    // jadi NULL kalau akun itu sudah dihapus.

    // Cari nama constraint FK secara dinamis (nama auto-generated
    // MySQL berbeda-beda tiap environment, jangan ditebak/hardcode).
    const [rows] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'announcements'
        AND COLUMN_NAME = 'created_by'
        AND REFERENCED_TABLE_NAME = 'admins'
    `);
    if (!rows.length) {
      throw new Error(
        'Tidak ketemu FK constraint announcements.created_by -> admins. ' +
        'Migration ini butuh constraint itu ada supaya bisa di-drop & diganti onDelete-nya.'
      );
    }
    const constraintName = rows[0].CONSTRAINT_NAME;

    await queryInterface.removeConstraint('announcements', constraintName);

    await queryInterface.changeColumn('announcements', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addConstraint('announcements', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'announcements_created_by_admins_fk',
      references: { table: 'admins', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('announcements', 'announcements_created_by_admins_fk');

    await queryInterface.changeColumn('announcements', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.addConstraint('announcements', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'announcements_created_by_admins_fk',
      references: { table: 'admins', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },
};
