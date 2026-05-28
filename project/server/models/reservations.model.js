const db = require('../config/db');

async function getOrCreateMemberId(conn, userId) {
  const [existing] = await conn.query(
    'SELECT MemberID FROM Members WHERE UserID = ? AND IsActive = 1 LIMIT 1',
    [userId],
  );
  if (existing.length) return existing[0].MemberID;

  await conn.query(
    `INSERT IGNORE INTO Members (UserID, MembershipCode, IsActive)
     VALUES (?, CONCAT('MEM-', ?), 1)`,
    [userId, userId],
  );

  const [created] = await conn.query(
    'SELECT MemberID FROM Members WHERE UserID = ? AND IsActive = 1 LIMIT 1',
    [userId],
  );
  return created[0]?.MemberID;
}

function baseQueueQuery(where = '') {
  return `
    SELECT
      r.ReservationID,
      r.BookID,
      b.Title AS BookTitle,
      b.AvailabilityStatus,
      b.Quantity,
      r.MemberID,
      m.UserID,
      u.Name AS UserName,
      u.Email AS UserEmail,
      r.ReservedAt,
      r.ExpiresAt,
      r.Status,
      ROW_NUMBER() OVER (
        PARTITION BY r.BookID
        ORDER BY r.ReservedAt ASC, r.ReservationID ASC
      ) AS QueuePosition
    FROM Reservations r
    JOIN Members m ON m.MemberID = r.MemberID
    JOIN Users u ON u.UserID = m.UserID
    JOIN Books b ON b.BookID = r.BookID
    ${where}
    ORDER BY r.Status = 'Active' DESC, b.Title ASC, r.ReservedAt ASC
  `;
}

exports.getAll = async () => {
  const [rows] = await db.query(baseQueueQuery());
  return rows;
};

exports.getActiveQueue = async () => {
  const [rows] = await db.query(baseQueueQuery("WHERE r.Status = 'Active'"));
  return rows;
};

exports.getByBookId = async (bookId) => {
  const [rows] = await db.query(
    baseQueueQuery("WHERE r.BookID = ? AND r.Status = 'Active'"),
    [bookId],
  );
  return rows;
};

exports.getById = async (id) => {
  const [rows] = await db.query(
    baseQueueQuery('WHERE r.ReservationID = ?'),
    [id],
  );
  return rows[0];
};

exports.createHold = async ({ bookId, userId }) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [bookRows] = await conn.query(
      'SELECT BookID, Title, AvailabilityStatus, Quantity FROM Books WHERE BookID = ? FOR UPDATE',
      [bookId],
    );

    if (!bookRows.length) {
      throw new Error('Book not found');
    }

    const book = bookRows[0];
    if (book.AvailabilityStatus === 'Available' && Number(book.Quantity) > 0) {
      throw new Error('Book is available. You can loan it instead of reserving it.');
    }

    const memberId = await getOrCreateMemberId(conn, userId);
    if (!memberId) {
      throw new Error('Active member record is required to reserve a book');
    }

    const [existing] = await conn.query(
      `SELECT ReservationID
       FROM Reservations
       WHERE BookID = ? AND MemberID = ? AND Status = 'Active'
       LIMIT 1`,
      [bookId, memberId],
    );

    if (existing.length) {
      throw new Error('You already have an active reservation for this book');
    }

    const [result] = await conn.query(
      `INSERT INTO Reservations (BookID, MemberID, ReservedAt, Status)
       VALUES (?, ?, NOW(), 'Active')`,
      [bookId, memberId],
    );

    await conn.commit();
    return exports.getById(result.insertId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

exports.updateStatus = async (id, status) => {
  const [result] = await db.query(
    'UPDATE Reservations SET Status = ? WHERE ReservationID = ?',
    [status, id],
  );
  return result.affectedRows;
};
