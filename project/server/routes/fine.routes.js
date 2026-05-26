const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fine.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.get('/', auth, fineController.getFines);
router.get('/:id', auth, fineController.getFineById);
router.post('/:id/pay', auth, fineController.payFine);
router.patch('/:id/status', auth, authorizeStaff, fineController.updateFineStatus);

module.exports = router;
