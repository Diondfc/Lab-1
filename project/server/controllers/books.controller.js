const pool = require('../config/db');

exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM Books WHERE BookID = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllBooks = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Books');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
