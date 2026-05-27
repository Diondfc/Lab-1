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
      b.AvailabilityStatus AS available,
      b.Rating AS rating,
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
      b.AvailabilityStatus AS available,
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
      b.AvailabilityStatus AS available,
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
      b.AvailabilityStatus AS available,
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
