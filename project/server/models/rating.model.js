const pool = require('../config/db');

async function createRating(data) {
  const { book_id, user_id, rating_value, comment } = data;

  const rating = Number(rating_value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('rating_value must be between 1 and 5');
  }

  const [result] = await pool.query(
    'INSERT INTO ratings (book_id, user_id, rating_value, comment) VALUES (?, ?, ?, ?)',
    [book_id, user_id, rating, comment || null]
  );

  const [rows] = await pool.query('SELECT * FROM ratings WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function getAllRatings() {
  const [rows] = await pool.query(
    'SELECT * FROM ratings ORDER BY created_at DESC'
  );
  return rows;
}

async function getRatingsByBookId(bookId) {
  const [rows] = await pool.query(
    'SELECT * FROM ratings WHERE book_id = ? ORDER BY created_at DESC',
    [bookId]
  );
  return rows;
}

async function deleteRating(id) {
  const [result] = await pool.query('DELETE FROM ratings WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = {
  createRating,
  getAllRatings,
  getRatingsByBookId,
  deleteRating,
};
