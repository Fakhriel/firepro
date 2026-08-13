const express = require('express');
const {
  listMineHandler,
  unreadCountHandler,
  markReadHandler,
  markAllReadHandler,
  deleteHandler,
} = require('./notifications.controller');
const { requireAdminAuth } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth);

// GET /api/notifications?unread=true
router.get('/', listMineHandler);
// GET /api/notifications/unread-count
router.get('/unread-count', unreadCountHandler);
// PATCH /api/notifications/:id/read
router.patch('/:id/read', markReadHandler);
// PATCH /api/notifications/read-all
router.patch('/read-all', markAllReadHandler);
// DELETE /api/notifications/:id
router.delete('/:id', deleteHandler);

module.exports = router;