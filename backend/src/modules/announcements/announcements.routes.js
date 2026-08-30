const express = require('express');
const { createHandler, listHandler } = require('./announcements.controller');
const { requireAdminAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth, requireRole('admin', 'owner'));

// GET /api/announcements — riwayat pengumuman yang pernah dikirim.
router.get('/', listHandler);
// POST /api/announcements — body: { title, message, targetRoles: string[] }
router.post('/', createHandler);

module.exports = router;