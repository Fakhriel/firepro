const express = require('express');
const { teamHandler } = require('./owner-attendance.controller');

const router = express.Router();

router.get('/team', teamHandler);

module.exports = router;