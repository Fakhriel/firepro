'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE `maintenance_schedules` MODIFY COLUMN `status` ENUM('scheduled', 'due_soon', 'overdue', 'in_progress', 'completed') NOT NULL DEFAULT 'scheduled'"
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE `maintenance_schedules` SET `status` = 'overdue' WHERE `status` = 'in_progress'"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE `maintenance_schedules` MODIFY COLUMN `status` ENUM('scheduled', 'due_soon', 'overdue', 'completed') NOT NULL DEFAULT 'scheduled'"
    );
  },
};
