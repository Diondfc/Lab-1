const express = require('express');
const router = express.Router();
const booksController = require('../controllers/books.controller');
const { uploadCover } = require('../middlewares/upload.middleware');
const { auth, authorizeStaff } = require('../middlewares/auth');

// Public catalog reads
router.get('/', booksController.getAllBooks);
router.get('/academic', booksController.getAcademicBooks);
router.get('/journals', booksController.getJournalBooks);
router.get('/novels', booksController.getNovelBooks);
router.get('/book/:id', booksController.getBookById);

// Staff-only catalog mutations
router.post('/add', auth, authorizeStaff, uploadCover.single('coverImage'), booksController.addBook);
router.put('/edit/:id', auth, authorizeStaff, uploadCover.single('coverImage'), booksController.editBook);
router.delete('/delete/:id', auth, authorizeStaff, booksController.deleteBook);

module.exports = router;
