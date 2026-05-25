const express = require('express');
const router = express.Router();
const locationsController = require('../controllers/locations.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

// GET all locations
router.get('/', locationsController.getAllLocations);

// POST create new location (Admin / Manager)
router.post('/', auth, authorizeStaff, locationsController.createLocation);

module.exports = router;
