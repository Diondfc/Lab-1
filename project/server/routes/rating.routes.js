const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');

router.post('/', ratingController.createRating);
router.get('/', ratingController.getAllRatings);
router.get('/book/:bookId', ratingController.getRatingsByBookId);
router.delete('/:id', ratingController.deleteRating);

module.exports = router;
