const { sequelize } = require('../src/config/db');
const { Admin } = require('../src/modules/admin-auth/admin.model');
const { Project } = require('../src/modules/projects/projects.model');
const { ProjectAssignment } = require('../src/modules/project-assignments/project-assignments.model');

async function run() {
  await sequelize.authenticate();

  const project = await Project.findOne({ order: [['id', 'ASC']] });
  if (!project) {
    console.log('[seed:technical] Tidak ada proyek sama sekali — buat proyek dulu lewat /api/projects, lalu jalankan ulang script ini.');
    process.exit(0);
  }

  const technicians = await Admin.findAll({ where: { role: 'karyawan' } });
  if (technicians.length === 0) {
    console.log('[seed:technical] Belum ada akun teknisi — jalankan `npm run seed:supervisor` dulu (ikut membuat teknisi1 & teknisi2).');
    process.exit(0);
  }

  for (const tech of technicians) {
    const existing = await ProjectAssignment.findOne({ where: { projectId: project.id, technicianId: tech.id } });
    if (existing) {
      console.log(`[seed:technical] ${tech.username} sudah ditugaskan ke proyek "${project.name}" — dilewati.`);
      continue;
    }
    await ProjectAssignment.create({
      projectId: project.id,
      technicianId: tech.id,
      note: 'Ditugaskan otomatis oleh seed:technical untuk keperluan testing.',
    });
    console.log(`[seed:technical] ${tech.username} ditugaskan ke proyek "${project.name}".`);
  }

  console.log('[seed:technical] Selesai. Login sebagai teknisi1/teknisi123, lalu cek GET /api/technical/tasks.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed:technical] Gagal:', err.message);
  process.exit(1);
});
