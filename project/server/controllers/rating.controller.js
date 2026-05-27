const pool = require('../config/db');
const { getUserId, isStaffRole, getUserRole } = require('../middlewares/auth');
const { ROLES } = require('../lib/roles');

async function refreshBookRating(bookId) {
  await pool.execute(
    `UPDATE Books
     SET Rating = COALESCE(
       (SELECT ROUND(AVG(rating_value), 2) FROM ratings WHERE book_id = ?),
       0
     )
     WHERE BookID = ?`,
    [bookId, bookId],
  );
}

async function getOrCreateMemberId(userId) {
  const [existing] = await pool.execute(
    'SELECT MemberID FROM Members WHERE UserID = ? AND IsActive = 1 LIMIT 1',
    [userId],
  );
  if (existing.length) return existing[0].MemberID;

  await pool.execute(
    `INSERT IGNORE INTO Members (UserID, MembershipCode, IsActive)
     VALUES (?, CONCAT('MEM-', ?), 1)`,
    [userId, userId],
  );

  const [created] = await pool.execute(
    'SELECT MemberID FROM Members WHERE UserID = ? AND IsActive = 1 LIMIT 1',
    [userId],
  );
  return created[0]?.MemberID;
}

exports.createRating = async (req, res) => {
  try {
    const { book_id, user_id, rating_value, comment } = req.body;
    const callerId = Number(getUserId(req));
    const callerRole = getUserRole(req);

    if (!book_id || !user_id || rating_value == null) {
      return res.status(400).json({ message: 'book_id, user_id and rating_value are required' });
    }

    if (callerRole !== ROLES.USER_MEMBER) {
      return res.status(403).json({ message: 'Only User/Member accounts can submit book ratings' });
    }

    if (Number(user_id) !== callerId) {
      return res.status(403).json({ message: 'Cannot submit a rating for another user' });
    }

    const rating = Number(rating_value);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating_value must be between 1 and 5' });
    }

    const [bookRows] = await pool.execute(
      'SELECT BookID FROM Books WHERE BookID = ?',
      [book_id],
    );
    if (!bookRows.length) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const memberId = await getOrCreateMemberId(user_id);
    if (!memberId) {
      return res.status(400).json({ message: 'Active member record is required to submit a review' });
    }

    const [result] = await pool.execute(
      'INSERT INTO ratings (book_id, user_id, MemberID, rating_value, comment) VALUES (?, ?, ?, ?, ?)',
      [book_id, user_id, memberId, rating, comment || null],
    );

    await pool.execute(
      `INSERT INTO BookReviews (BookID, MemberID, Rating, ReviewText)
       VALUES (?, ?, ?, ?)`,
      [book_id, memberId, rating, comment || null],
    );

    await refreshBookRating(book_id);

    const [rows] = await pool.execute('SELECT * FROM ratings WHERE id = ?', [
      result.insertId,
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllRatings = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, b.Title AS book_title
       FROM ratings r
       LEFT JOIN Books b ON r.book_id = b.BookID
       ORDER BY r.created_at DESC`,
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
      [bookId],
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
    const callerId = Number(getUserId(req));

    const [existing] = await pool.execute(
      'SELECT user_id, book_id FROM ratings WHERE id = ?',
      [id],
    );

    if (!existing.length) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    const { user_id: ownerId, book_id: bookId } = existing[0];
    if (Number(ownerId) !== callerId && !isStaffRole(req.user?.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this rating' });
    }

    await pool.execute('DELETE FROM ratings WHERE id = ?', [id]);
    await refreshBookRating(bookId);

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
