const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.get('/most-read-books', auth, authorizeStaff, reportsController.getMostReadBooks);

module.exports = router;
