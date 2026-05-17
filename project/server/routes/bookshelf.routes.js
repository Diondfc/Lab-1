const express = require('express');
const router = express.Router();
const bookshelfController = require('../controllers/bookshelf.controller');
const { auth } = require('../middlewares/auth');

// Protect all routes with auth middleware
router.use(auth);

// Add a book to the bookshelf
router.post('/', bookshelfController.addBook);

// Get all books for the current user
router.get('/', bookshelfController.getBooks);

// Update a book
router.put('/:bookId', bookshelfController.updateBook);

// Delete a book
router.delete('/:bookId', bookshelfController.deleteBook);

module.exports = router;