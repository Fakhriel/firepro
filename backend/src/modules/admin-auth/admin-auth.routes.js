const express = require('express');
const { loginHandler, meHandler } = require('./admin-auth.controller');
const { requireAdminAuth } = require('../../middleware/auth');
const { loginLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, loginHandler);

router.get('/me', requireAdminAuth, meHandler);

module.exports = router;