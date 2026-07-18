const express = require('express');
const {
  meHandler,
  updateMeHandler,
  changeMyPasswordHandler,
} = require('./technical-profile.controller');

const router = express.Router();

// GET /api/technical/profile — data diri sendiri.
router.get('/', meHandler);
// PATCH /api/technical/profile — body: { name?, username?, phone?, email? }
router.patch('/', updateMeHandler);
// PATCH /api/technical/profile/password — body: { currentPassword, newPassword }
router.patch('/password', changeMyPasswordHandler);

module.exports = router;
