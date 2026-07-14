const express = require('express');
const {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('./projects.controller');
const { requireAdminAuth } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdminAuth);


router.get('/admin', listHandler);
router.get('/:id', getByIdHandler);
router.post('/', createHandler);
router.patch('/:id', updateHandler);
router.delete('/:id', deleteHandler);

module.exports = router;