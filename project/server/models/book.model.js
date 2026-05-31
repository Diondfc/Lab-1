const db = require('../config/db');

async function queryRows(sql, params = []) {
  const [rows] = await db.query(sql, params);
  return rows;
}

exports.getAllBooks = async () => {
  return queryRows(`
    SELECT 
      b.BookID AS id,
      b.ISBN AS isbn,
      b.Title AS title,
      b.Author AS author,
      b.AuthorID AS authorId,
      CASE
        WHEN b.AvailabilityStatus = 'Available' AND b.Quantity > 0 THEN 'Available'
        ELSE 'Unavailable'
      END AS available,
      b.Rating AS rating,
      b.Quantity AS Quantity,
      b.CoverImagePath AS coverImagePath,
      c.CategoryName AS category
    FROM Books b
    JOIN Categories c ON b.CategoryID = c.CategoryID
  `);
};

exports.getAcademicBooks = async () => {
  return queryRows(`
    SELECT 
      b.BookID AS id,
      b.ISBN AS isbn,
      b.Title AS title,
      b.Author AS author,
      b.AuthorID AS authorId,
      CASE
        WHEN b.AvailabilityStatus = 'Available' AND b.Quantity > 0 THEN 'Available'
        ELSE 'Unavailable'
      END AS available,
      b.Rating AS rating,
      b.CoverImagePath AS coverImagePath,
      b.Publisher AS publisher,
      b.PublisherID AS publisherId,
      b.YearOfPublishment AS year,
      b.Quantity AS quantity,
      b.Description AS description
    FROM Books b
    JOIN Categories c ON b.CategoryID = c.CategoryID
    WHERE c.CategoryName = 'Academic'
  `);
};

exports.getJournalBooks = async () => {
  return queryRows(`
    SELECT 
      b.BookID AS id,
      b.ISBN AS isbn,
      b.Title AS title,
      b.Author AS author,
      b.AuthorID AS authorId,
      CASE
        WHEN b.AvailabilityStatus = 'Available' AND b.Quantity > 0 THEN 'Available'
        ELSE 'Unavailable'
      END AS available,
      b.Rating AS rating,
      b.CoverImagePath AS coverImagePath,
      b.Publisher AS publisher,
      b.PublisherID AS publisherId,
      b.YearOfPublishment AS year,
      b.Quantity AS quantity,
      b.Description AS description
    FROM Books b
    JOIN Categories c ON b.CategoryID = c.CategoryID
    WHERE c.CategoryName = 'Journal'
  `);
};

exports.getNovelBooks = async (subcategory) => {
  let sql = `
    SELECT
      b.BookID AS id,
      b.ISBN AS isbn,
      b.Title AS title,
      b.Author AS author,
      b.AuthorID AS authorId,
      CASE
        WHEN b.AvailabilityStatus = 'Available' AND b.Quantity > 0 THEN 'Available'
        ELSE 'Unavailable'
      END AS available,
      b.Rating AS rating,
      b.CoverImagePath AS coverImagePath,
      b.Publisher AS publisher,
      b.PublisherID AS publisherId,
      b.YearOfPublishment AS year,
      b.Quantity AS quantity,
      b.Description AS description,
      s.SubCategoryName AS subcategory
    FROM Books b
    JOIN Categories c ON b.CategoryID = c.CategoryID
    LEFT JOIN SubCategories s ON b.SubCategoryID = s.SubCategoryID
    WHERE c.CategoryName = 'Novel'
  `;

  const params = [];

  if (subcategory) {
    sql += ` AND s.SubCategoryName = ?`;
    params.push(subcategory);
  }

  return queryRows(sql, params);
};

exports.getBookById = async (bookId) => {
  const rows = await queryRows(
    `SELECT * FROM Books WHERE BookID = ?`,
    [bookId],
  );
  return rows[0] || null;
};

exports.searchBooks = async ({ title, author, category, isbn }) => {
  const where = [];
  const params = [];

  if (title) {
    where.push('b.Title LIKE ?');
    params.push(`%${title}%`);
  }
  if (author) {
    where.push('(a.Name LIKE ? OR b.Author LIKE ?)');
    params.push(`%${author}%`, `%${author}%`);
  }
  if (category) {
    where.push('c.CategoryName = ?');
    params.push(category);
  }
  if (isbn) {
    where.push('b.ISBN LIKE ?');
    params.push(`%${isbn}%`);
  }

  return queryRows(
    `
    SELECT
      b.BookID AS id,
      b.ISBN AS isbn,
      b.Title AS title,
      COALESCE(a.Name, b.Author) AS author,
      b.Publisher AS publisher,
      b.YearOfPublishment AS year,
      b.AvailabilityStatus AS availabilityStatus,
      b.Quantity AS quantity,
      b.Rating AS rating,
      c.CategoryName AS category,
      COUNT(l.LoanID) AS loanCount
    FROM Books b
    JOIN Categories c ON b.CategoryID = c.CategoryID
    LEFT JOIN Authors a ON a.AuthorID = b.AuthorID
    LEFT JOIN Loans l ON l.BookID = b.BookID
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY
      b.BookID,
      b.ISBN,
      b.Title,
      b.Author,
      a.Name,
      b.Publisher,
      b.YearOfPublishment,
      b.AvailabilityStatus,
      b.Quantity,
      b.Rating,
      c.CategoryName
    ORDER BY b.Title ASC
    LIMIT 100
    `,
    params,
  );
};

exports.getMostReadBooks = async () => {
  return queryRows(`
    SELECT
      b.BookID AS id,
      b.Title AS title,
      b.Author AS author,
      b.ISBN AS isbn,
      c.CategoryName AS category,
      COUNT(l.LoanID) AS loanCount
    FROM Books b
    JOIN Categories c ON b.CategoryID = c.CategoryID
    LEFT JOIN Loans l ON l.BookID = b.BookID
    GROUP BY b.BookID, b.Title, b.Author, b.ISBN, c.CategoryName
    ORDER BY loanCount DESC, b.Title ASC
    LIMIT 10
  `);
};

exports.getActiveMembersReport = async () => {
  return queryRows(`
    SELECT
      u.UserID AS id,
      u.Name AS name,
      u.Email AS email,
      m.MembershipCode AS membershipCode,
      COUNT(l.LoanID) AS loanCount,
      MAX(l.StartDate) AS lastLoanDate
    FROM Members m
    JOIN Users u ON u.UserID = m.UserID
    LEFT JOIN Loans l ON l.UserID = u.UserID
    WHERE m.IsActive = 1 AND u.Status = 'Active'
    GROUP BY u.UserID, u.Name, u.Email, m.MembershipCode
    ORDER BY loanCount DESC, u.Name ASC
    LIMIT 10
  `);
};

exports.getAvailabilityTimeline = async (bookId, userId = null) => {
  const [bookRows] = await db.query(
    `SELECT
      BookID,
      Title,
      AvailabilityStatus,
      Quantity
     FROM Books
     WHERE BookID = ?`,
    [bookId],
  );

  if (!bookRows.length) return null;

  const book = bookRows[0];
  const isAvailable = book.AvailabilityStatus === 'Available' && Number(book.Quantity) > 0;

  const [activeLoanRows] = await db.query(
    `SELECT
      l.LoanID,
      l.UserID,
      l.UserName,
      DATE_FORMAT(l.StartDate, '%Y-%m-%d') AS StartDate,
      DATE_FORMAT(l.DueDate, '%Y-%m-%d') AS DueDate,
      CASE
        WHEN l.DueDate < CURDATE() THEN 'overdue'
        ELSE 'on_loan'
      END AS LoanStatus
     FROM Loans l
     LEFT JOIN ReturnLoans r ON r.LoanID = l.LoanID
     WHERE l.BookID = ? AND r.ReturnID IS NULL
     ORDER BY l.StartDate DESC, l.LoanID DESC
     LIMIT 1`,
    [bookId],
  );

  const [queueRows] = await db.query(
    `SELECT
      r.ReservationID,
      m.UserID,
      u.Name AS UserName,
      r.Status,
      DATE_FORMAT(r.ReservedAt, '%Y-%m-%d %H:%i:%s') AS ReservedAt,
      ROW_NUMBER() OVER (ORDER BY r.ReservedAt ASC, r.ReservationID ASC) AS QueuePosition
     FROM Reservations r
     JOIN Members m ON m.MemberID = r.MemberID
     JOIN Users u ON u.UserID = m.UserID
     WHERE r.BookID = ? AND r.Status = 'Active'
     ORDER BY r.ReservedAt ASC, r.ReservationID ASC`,
    [bookId],
  );

  const currentUserReservation = userId
    ? queueRows.find((item) => Number(item.UserID) === Number(userId)) || null
    : null;

  return {
    bookId: book.BookID,
    title: book.Title,
    status: isAvailable ? 'available' : activeLoanRows.length ? activeLoanRows[0].LoanStatus : 'unavailable',
    isAvailable,
    quantity: Number(book.Quantity) || 0,
    currentLoan: activeLoanRows[0] || null,
    queueCount: queueRows.length,
    currentUserReservation,
    queuePreview: queueRows.slice(0, 5),
  };
};

exports.addBook = async (book) => {
  const {
    ISBN,
    Title,
    AvailabilityStatus,
    Publisher,
    PublisherID,
    YearOfPublishment,
    CategoryID,
    SubCategoryID,
    Author,
    AuthorID,
    Rating,
    CoverImagePath,
    Description,
    Quantity,
  } = book;

  const [result] = await db.query(
    `
    INSERT INTO Books (
      ISBN, Title, AvailabilityStatus, Publisher, PublisherID, YearOfPublishment,
      CategoryID, SubCategoryID, Author, AuthorID, Rating, CoverImagePath,
      Description, Quantity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      ISBN,
      Title,
      AvailabilityStatus,
      Publisher,
      PublisherID || null,
      YearOfPublishment,
      CategoryID,
      SubCategoryID || null,
      Author,
      AuthorID || null,
      Rating,
      CoverImagePath,
      Description,
      Quantity,
    ],
  );

  return result.insertId;
};

exports.editBook = async (bookId, updatedBook) => {
  const {
    ISBN,
    Title,
    AvailabilityStatus,
    Publisher,
    PublisherID,
    YearOfPublishment,
    CategoryID,
    SubCategoryID,
    Author,
    AuthorID,
    Rating,
    CoverImagePath,
    Description,
    Quantity,
  } = updatedBook;

  const [result] = await db.query(
    `
    UPDATE Books SET
      ISBN = ?, Title = ?, AvailabilityStatus = ?, Publisher = ?, PublisherID = ?, YearOfPublishment = ?,
      CategoryID = ?, SubCategoryID = ?, Author = ?, AuthorID = ?, Rating = ?, CoverImagePath = ?,
      Description = ?, Quantity = ?
    WHERE BookID = ?
    `,
    [
      ISBN,
      Title,
      AvailabilityStatus,
      Publisher,
      PublisherID || null,
      YearOfPublishment,
      CategoryID,
      SubCategoryID || null,
      Author,
      AuthorID || null,
      Rating,
      CoverImagePath,
      Description,
      Quantity,
      bookId,
    ],
  );

  return result;
};

exports.deleteBook = async (bookId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('DELETE FROM ratings WHERE BookID = ?', [bookId]);
    await connection.query('DELETE FROM BookReviews WHERE BookID = ?', [bookId]);

    const [result] = await connection.query(
      'DELETE FROM Books WHERE BookID = ?',
      [bookId],
    );

    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.updateBookRating = async (bookId, averageRating) => {
  let ratingToUpdate;

  if (averageRating !== undefined) {
    ratingToUpdate = averageRating;
  } else {
    const rows = await queryRows(
      `SELECT AVG(rating_value) AS averageRating 
       FROM BookReviews 
       WHERE BookID = ?`,
      [bookId],
    );

    ratingToUpdate = Math.round((rows[0]?.averageRating || 0) * 100) / 100;
  }

  await db.query(
    `UPDATE Books 
     SET Rating = ?
     WHERE BookID = ?`,
    [ratingToUpdate, bookId],
  );

  return ratingToUpdate;
};

exports.countBooksByCategory = async () => {
  return queryRows(`
    SELECT 
      c.CategoryName AS category,
      COUNT(*) AS count
    FROM Books b
    JOIN Categories c ON b.CategoryID = c.CategoryID
    GROUP BY c.CategoryName
  `);
};

exports.countAllBooks = async () => {
  const rows = await queryRows(`SELECT COUNT(*) AS total FROM Books`);
  return rows;
};
