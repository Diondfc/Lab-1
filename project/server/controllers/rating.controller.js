const pool = require('../config/db');

exports.createRating = async (req, res) => {
  try {
    const { book_id, user_id, rating_value, comment } = req.body;

    if (!book_id || !user_id || rating_value == null) {
      return res.status(400).json({ message: 'book_id, user_id and rating_value are required' });
    }

    const rating = Number(rating_value);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating_value must be between 1 and 5' });
    }

    const [result] = await pool.execute(
      'INSERT INTO ratings (book_id, user_id, rating_value, comment) VALUES (?, ?, ?, ?)',
      [book_id, user_id, rating, comment || null]
    );

    const [rows] = await pool.execute('SELECT * FROM ratings WHERE id = ?', [result.insertId]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllRatings = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM ratings ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRatingsByBookId = async (req, res) => {
  try {
    const { bookId } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM ratings WHERE book_id = ? ORDER BY created_at DESC',
      [bookId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching ratings by book:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteRating = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM ratings WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
