'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE `admins` MODIFY COLUMN `role` ENUM('admin', 'superadmin', 'owner', 'supervisor', 'karyawan') NOT NULL DEFAULT 'admin'"
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE `admins` SET `role` = 'admin' WHERE `role` NOT IN ('admin', 'superadmin')"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE `admins` MODIFY COLUMN `role` ENUM('admin', 'superadmin') NOT NULL DEFAULT 'admin'"
    );
  },
};
