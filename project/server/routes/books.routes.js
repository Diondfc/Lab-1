const express = require('express');
const router = express.Router();
const booksController = require('../controllers/books.controller');
const { uploadBookCover } = require('../middlewares/bookUpload');

router.get('/', booksController.getAllBooks);
router.get('/book/:id', booksController.getBookById);
router.post('/add', uploadBookCover, booksController.createBook);

module.exports = router;
