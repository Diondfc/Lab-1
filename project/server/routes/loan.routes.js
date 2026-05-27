const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');
const { auth, authorizeStaff, authorizeSelfOrStaff } = require('../middlewares/auth');

// Specific paths before /:id
router.get('/total-count', auth, authorizeStaff, loanController.getTotalLoansCount);
router.get('/user/:userId', auth, authorizeSelfOrStaff('userId'), loanController.getUserLoans);

router.get('/', auth, authorizeStaff, loanController.getAllLoans);
router.post('/', auth, loanController.createLoan);
router.put('/:id', auth, authorizeStaff, loanController.updateLoan);
router.delete('/:id', auth, authorizeStaff, loanController.deleteLoan);
router.get('/:id', auth, loanController.getLoanById);

module.exports = router;
