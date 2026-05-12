const express = require('express');
const router = express.Router();
const locationsController = require('../controllers/locations.controller');
const { auth, authorizeRoles } = require('../middlewares/auth');

// GET all locations
router.get('/', locationsController.getAllLocations);

// POST create new location (Admin only)
router.post('/', 
    auth,
    authorizeRoles('Admin'),
    locationsController.createLocation
);

module.exports = router;
