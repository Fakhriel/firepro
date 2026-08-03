'use strict';

// Kategori lama (hpp/ads/shipping/ops/other) adalah sisa dari konteks
// e-commerce, tidak relevan untuk kontraktor fire safety. Diganti
// sesuai kategori BOQ pada brief: material/labor/service/equipment/other.
// project_id ditambahkan agar biaya bisa dikaitkan ke proyek tertentu
// (untuk ROI per-proyek), tetap nullable untuk biaya operasional umum
// yang tidak terikat ke satu proyek.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cost_entries', 'project_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('cost_entries', ['project_id']);

    await queryInterface.sequelize.query(
      `UPDATE cost_entries SET category = CASE category
        WHEN 'hpp' THEN 'material'
        WHEN 'ads' THEN 'other'
        WHEN 'shipping' THEN 'other'
        WHEN 'ops' THEN 'service'
        ELSE 'other'
      END`,
    );

    await queryInterface.changeColumn('cost_entries', 'category', {
      type: Sequelize.ENUM('material', 'labor', 'service', 'equipment', 'other'),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('cost_entries', 'project_id');
    await queryInterface.sequelize.query(
      `UPDATE cost_entries SET category = 'other' WHERE category NOT IN ('hpp','ads','shipping','ops','other')`,
    );
    await queryInterface.changeColumn('cost_entries', 'category', {
      type: Sequelize.ENUM('hpp', 'ads', 'shipping', 'ops', 'other'),
      allowNull: false,
    });
  },
};
