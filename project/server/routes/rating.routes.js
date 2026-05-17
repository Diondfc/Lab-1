const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.get('/book/:bookId', ratingController.getRatingsByBookId);
router.get('/', auth, authorizeStaff, ratingController.getAllRatings);
router.post('/', auth, ratingController.createRating);
router.delete('/:id', auth, ratingController.deleteRating);

module.exports = router;
