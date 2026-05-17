const Bookshelf = require('../models/bookshelf.model');

function getUserId(req) {
  return req.user?.id ?? req.user?.user?.id;
}

const bookshelfController = {
  addBook: async (req, res) => {
    try {
      const { title, spineColor } = req.body;
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({ message: 'User ID not found in token' });
      }
      if (!title?.trim()) {
        return res.status(400).json({ message: 'Title is required' });
      }

      const bookId = await Bookshelf.addBook(
        userId,
        title.trim(),
        spineColor || '#2e7ad2',
      );
      const book = await Bookshelf.getBookById(userId, bookId);

      res.status(201).json(book);
    } catch (error) {
      console.error('Error adding book to bookshelf:', error);
      res.status(500).json({ message: 'Error adding book to bookshelf' });
    }
  },

  getBooks: async (req, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({ message: 'User ID not found in token' });
      }

      const books = await Bookshelf.getBooksByUser(userId);
      res.json(books);
    } catch (error) {
      console.error('Error fetching bookshelf:', error);
      res.status(500).json({
        message: 'Error fetching bookshelf',
        error: error.message,
      });
    }
  },

  updateBook: async (req, res) => {
    try {
      const { bookId } = req.params;
      const { title, spineColor } = req.body;
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({ message: 'User ID not found in token' });
      }

      const success = await Bookshelf.updateBook(
        userId,
        bookId,
        title,
        spineColor,
      );
      if (!success) {
        return res
          .status(404)
          .json({ message: 'Book not found or not owned by user' });
      }

      const book = await Bookshelf.getBookById(userId, bookId);
      res.json(book);
    } catch (error) {
      console.error('Error updating bookshelf book:', error);
      res.status(500).json({ message: 'Error updating book' });
    }
  },

  deleteBook: async (req, res) => {
    try {
      const { bookId } = req.params;
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({ message: 'User ID not found in token' });
      }

      const success = await Bookshelf.deleteBook(userId, bookId);
      if (!success) {
        return res
          .status(404)
          .json({ message: 'Book not found or not owned by user' });
      }

      res.json({ message: 'Book deleted successfully' });
    } catch (error) {
      console.error('Error deleting bookshelf book:', error);
      res.status(500).json({ message: 'Error deleting book' });
    }
  },
};

module.exports = bookshelfController;
