const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');


router.post('/', loanController.createLoan); 
router.get('/', loanController.getAllLoans);
router.get('/user/:userId', loanController.getUserLoans);
router.delete('/:id', loanController.deleteLoan);
router.get('/:id', loanController.getLoanById);
router.get('/total-count', loanController.getTotalLoansCount);



module.exports = router;