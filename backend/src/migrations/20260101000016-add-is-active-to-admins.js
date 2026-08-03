'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fitur "Nonaktifkan/Aktifkan kembali user" — sebelumnya cuma ada
    // Create/Edit/Delete, tidak ada soft-disable. Owner butuh cara
    // mematikan akses akun tanpa menghapus datanya secara permanen
    // (mis. karyawan resign sementara, atau lagi ditinjau).
    await queryInterface.addColumn('admins', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('admins', 'is_active');
  },
};
