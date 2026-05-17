const db = require('../config/db');

function mapRow(row) {
  return {
    id: row.BookshelfID,
    _id: row.BookshelfID,
    title: row.Title,
    spineColor: row.SpineColor,
    userId: row.UserID,
  };
}

const Bookshelf = {
  addBook: async (userId, title, spineColor) => {
    const [result] = await db.query(
      'INSERT INTO Bookshelf (UserID, Title, SpineColor) VALUES (?, ?, ?)',
      [userId, title, spineColor],
    );
    return result.insertId;
  },

  getBookById: async (userId, bookId) => {
    const [rows] = await db.query(
      'SELECT * FROM Bookshelf WHERE BookshelfID = ? AND UserID = ?',
      [bookId, userId],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  getBooksByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM Bookshelf WHERE UserID = ? ORDER BY BookshelfID ASC',
      [userId],
    );
    return rows.map(mapRow);
  },

  updateBook: async (userId, bookId, title, spineColor) => {
    const [result] = await db.query(
      'UPDATE Bookshelf SET Title = ?, SpineColor = ? WHERE BookshelfID = ? AND UserID = ?',
      [title, spineColor, bookId, userId],
    );
    return result.affectedRows > 0;
  },

  deleteBook: async (userId, bookId) => {
    const [result] = await db.query(
      'DELETE FROM Bookshelf WHERE BookshelfID = ? AND UserID = ?',
      [bookId, userId],
    );
    return result.affectedRows > 0;
  },
};

module.exports = Bookshelf;
