const db = require('../config/db');


const Bookshelf = {
    // Add a book to the bookshelf
    addBook: async (userId, title, spineColor) => {
        const [result] = await db.query(
            'INSERT INTO Bookshelf (UserID, Title, SpineColor) VALUES (?, ?, ?)',
            [userId, title, spineColor]
        );
        return result.insertId;
    },

    // Get all books for a user
    getBooksByUser: async (userId) => {
      const [books] = await db.query(
          'SELECT * FROM Bookshelf WHERE UserID = ? ORDER BY BookshelfID ASC',
          [userId]
      );
      return books;
    },

    // Update a book
    updateBook: async (userId, bookId, title, spineColor) => {
        const [result] = await db.query(
            'UPDATE Bookshelf SET Title = ?, SpineColor = ? WHERE BookshelfID = ? AND UserID = ?',
            [title, spineColor, bookId, userId]
        );
        return result.affectedRows > 0;
    },

    // Delete a book
    deleteBook: async (userId, bookId) => {
        const [result] = await db.query(
            'DELETE FROM Bookshelf WHERE BookshelfID= ? AND UserID = ?',
            [bookId, userId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = Bookshelf;