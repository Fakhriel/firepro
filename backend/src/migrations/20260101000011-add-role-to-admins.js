'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('admins', 'role', {
      type: Sequelize.ENUM('admin', 'superadmin'),
      allowNull: false,
      defaultValue: 'admin',
    });

  
    await queryInterface.sequelize.query(
      "UPDATE admins SET role = 'superadmin'"
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('admins', 'role');
  },
};
