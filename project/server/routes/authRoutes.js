const express = require('express');
const router = express.Router();

// Import the controller we just fixed!
const { register, login } = require('../controllers/authController');

// When someone POSTs to /register, run the register function!
router.post('/register', register);

// When someone POSTs to /login, run the login function!
router.post('/login', login);

module.exports = router;
