const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.get('/stats', auth, authorizeStaff, dashboardController.getStats);

module.exports = router;
