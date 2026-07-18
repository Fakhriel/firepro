'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) Kontak dasar buat halaman Profile (Teknisi/Supervisor/Owner) —
    //    sebelumnya tabel admins cuma punya username, tidak ada cara
    //    menyimpan email/no. telepon untuk ditampilkan/diedit sendiri.
    await queryInterface.addColumn('admins', 'phone', {
      type: Sequelize.STRING(30),
      allowNull: true,
    });
    await queryInterface.addColumn('admins', 'email', {
      type: Sequelize.STRING(150),
      allowNull: true,
    });

    // 2) attendance — dipakai bersama Teknisi (isi sendiri) & Supervisor/
    //    Owner (baca untuk monitoring tim). 1 baris = 1 orang per hari.
    await queryInterface.createTable('attendance', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      work_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      check_in_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      check_in_location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      check_out_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      check_out_location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('checked_in', 'checked_out'),
        allowNull: false,
        defaultValue: 'checked_in',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    // 1 orang cuma boleh punya 1 record absensi per tanggal — mencegah
    // check-in dobel di hari yang sama.
    await queryInterface.addIndex('attendance', ['admin_id', 'work_date'], {
      unique: true,
      name: 'attendance_admin_date_unique',
    });
    await queryInterface.addIndex('attendance', ['work_date']);

    // 3) daily_reports — laporan harian Teknisi, ditinjau Supervisor.
    await queryInterface.createTable('daily_reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      technician_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      assignment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'project_assignments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      report_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      materials_used: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      obstacle: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('submitted', 'reviewed'),
        allowNull: false,
        defaultValue: 'submitted',
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      review_note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('daily_reports', ['technician_id']);
    await queryInterface.addIndex('daily_reports', ['report_date']);
    await queryInterface.addIndex('daily_reports', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('daily_reports');
    await queryInterface.dropTable('attendance');
    await queryInterface.removeColumn('admins', 'email');
    await queryInterface.removeColumn('admins', 'phone');
  },
};
