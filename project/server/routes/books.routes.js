const express = require('express');
const router = express.Router();
const booksController = require('../controllers/books.controller');
const { uploadCover } = require('../middlewares/upload.middleware');

router.get('/', booksController.getAllBooks);
router.get('/academic', booksController.getAcademicBooks);
router.get('/journals', booksController.getJournalBooks);
router.get('/novels', booksController.getNovelBooks);
router.get('/book/:id', booksController.getBookById);

router.post('/add', uploadCover.single('coverImage'), booksController.addBook);
router.put('/edit/:id', uploadCover.single('coverImage'), booksController.editBook);
router.delete('/delete/:id', booksController.deleteBook);

module.exports = router;
