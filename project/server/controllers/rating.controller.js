const pool = require('../config/db');
const { getUserId, isStaffRole, getUserRole } = require('../middlewares/auth');
const { ROLES } = require('../lib/roles');

async function ensureReviewTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS BookReviews (
      ReviewID INT UNSIGNED NOT NULL AUTO_INCREMENT,
      BookID INT UNSIGNED NOT NULL,
      MemberID INT UNSIGNED NOT NULL,
      Rating TINYINT UNSIGNED NOT NULL,
      ReviewText TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (ReviewID),
      KEY idx_review_book (BookID),
      KEY idx_review_member (MemberID),
      CONSTRAINT fk_review_book FOREIGN KEY (BookID) REFERENCES Books (BookID) ON DELETE CASCADE,
      CONSTRAINT fk_review_member FOREIGN KEY (MemberID) REFERENCES Members (MemberID) ON DELETE CASCADE,
      CONSTRAINT chk_review_rating CHECK (Rating BETWEEN 1 AND 5)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      book_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      MemberID INT UNSIGNED NULL,
      rating_value TINYINT UNSIGNED NOT NULL,
      comment TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_ratings_book (book_id),
      KEY idx_ratings_user (user_id),
      KEY idx_ratings_member (MemberID),
      CONSTRAINT fk_ratings_book FOREIGN KEY (book_id) REFERENCES Books (BookID) ON DELETE CASCADE,
      CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES Users (UserID) ON DELETE CASCADE,
      CONSTRAINT fk_ratings_member FOREIGN KEY (MemberID) REFERENCES Members (MemberID) ON DELETE SET NULL,
      CONSTRAINT chk_rating_value CHECK (rating_value BETWEEN 1 AND 5)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function refreshBookRating(bookId) {
  await ensureReviewTables();
  await pool.execute(
    `UPDATE Books
     SET Rating = COALESCE(
       (SELECT ROUND(AVG(Rating), 2) FROM BookReviews WHERE BookID = ?),
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
    await ensureReviewTables();
    const { book_id, rating_value, comment } = req.body;
    const callerRole = getUserRole(req);
    const userId = getUserId(req);

    if (!book_id || rating_value == null) {
      return res.status(400).json({ message: 'book_id and rating_value are required' });
    }
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (callerRole !== ROLES.USER_MEMBER) {
      return res.status(403).json({ message: 'Only User/Member accounts can submit book ratings' });
    }

    const rating = Number(rating_value);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating_value must be between 1 and 5' });
    }

    const [bookRows] = await pool.execute('SELECT BookID FROM Books WHERE BookID = ?', [book_id]);
    if (!bookRows.length) return res.status(404).json({ message: 'Book not found' });

    const memberId = await getOrCreateMemberId(userId);
    if (!memberId) {
      return res.status(400).json({ message: 'Active member record is required to submit a review' });
    }

    await pool.execute(
      'INSERT INTO ratings (book_id, user_id, MemberID, rating_value, comment) VALUES (?, ?, ?, ?, ?)',
      [book_id, userId, memberId, rating, comment || null],
    );

    const [reviewResult] = await pool.execute(
      `INSERT INTO BookReviews (BookID, MemberID, Rating, ReviewText)
       VALUES (?, ?, ?, ?)`,
      [book_id, memberId, rating, comment || null],
    );

    await refreshBookRating(book_id);
    const [rows] = await pool.execute('SELECT * FROM BookReviews WHERE ReviewID = ?', [reviewResult.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllRatings = async (_req, res) => {
  try {
    await ensureReviewTables();
    const [rows] = await pool.execute(
      `SELECT br.*, b.Title AS book_title
       FROM BookReviews br
       LEFT JOIN Books b ON br.BookID = b.BookID
       ORDER BY br.created_at DESC`,
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRatingsByBookId = async (req, res) => {
  try {
    await ensureReviewTables();
    const { bookId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM BookReviews WHERE BookID = ? ORDER BY created_at DESC',
      [bookId],
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ratings by book:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteRating = async (req, res) => {
  try {
    await ensureReviewTables();
    const { id } = req.params;
    const callerId = Number(getUserId(req));

    const [existing] = await pool.execute(
      `SELECT br.MemberID, br.BookID, m.UserID
       FROM BookReviews br
       JOIN Members m ON br.MemberID = m.MemberID
       WHERE br.ReviewID = ?`,
      [id],
    );

    if (!existing.length) return res.status(404).json({ message: 'Rating not found' });

    const ownerUserId = Number(existing[0].UserID);
    const bookId = existing[0].BookID;

    if (ownerUserId !== callerId && !isStaffRole(req.user?.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this rating' });
    }

    await pool.execute('DELETE FROM BookReviews WHERE ReviewID = ?', [id]);
    await refreshBookRating(bookId);
    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
