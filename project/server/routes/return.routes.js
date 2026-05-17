const express = require('express');
const router = express.Router();
const returnController = require('../controllers/return.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.post('/', auth, authorizeStaff, returnController.processReturn);

module.exports = router;
