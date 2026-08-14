'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Upgrade absensi: sebelumnya checkInLocation/checkOutLocation cuma
    // teks bebas (tidak pernah diisi dari mana pun di frontend). Sekarang
    // ditambah koordinat GPS asli (lat/lng dari browser Geolocation API)
    // dan foto — sesuai kebutuhan "absensi lebih terpercaya" untuk
    // Admin/Supervisor/Karyawan Teknisi (Owner tidak absen sama sekali,
    // jadi kolom ini tidak relevan untuk role Owner).
    await queryInterface.addColumn('attendance', 'check_in_lat', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });
    await queryInterface.addColumn('attendance', 'check_in_lng', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });
    await queryInterface.addColumn('attendance', 'check_in_photo', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('attendance', 'check_out_lat', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });
    await queryInterface.addColumn('attendance', 'check_out_lng', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });
    await queryInterface.addColumn('attendance', 'check_out_photo', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('attendance', 'check_in_lat');
    await queryInterface.removeColumn('attendance', 'check_in_lng');
    await queryInterface.removeColumn('attendance', 'check_in_photo');
    await queryInterface.removeColumn('attendance', 'check_out_lat');
    await queryInterface.removeColumn('attendance', 'check_out_lng');
    await queryInterface.removeColumn('attendance', 'check_out_photo');
  },
};
