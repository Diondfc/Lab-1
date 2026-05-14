const express = require('express');
const router = express.Router();
const returnController = require('../controllers/return.controller');

router.post('/', returnController.processReturn);


module.exports = router;