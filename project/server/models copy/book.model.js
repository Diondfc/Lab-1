const db = require('../config/db');

exports.getAllBooks = async () => {
  return await db.execute(`
    SELECT 
      b.BookID AS id,
      b.ISBN AS isbn,
      b.Title AS title,
      b.Author AS author,
      b.AvailabilityStatus AS available,
      b.Rating AS rating,
      b.CoverImagePath AS coverImagePath,
      c.CategoryName AS category
    FROM Books b
    JOIN Categories c ON b.CategoryID = c.CategoryID
  `);
};

exports.getAcademicBooks = async () => {
  return await db.execute(`
    SELECT 
      b.BookID AS id,
      b.ISBN AS isbn,
      b.Title AS title,
      b.Author AS author,
      b.AvailabilityStatus AS available,
      b.Rating AS rating,
      b.CoverImagePath AS coverImagePath,
      b.Publisher AS publisher,
      b.YearOfPublishment AS year,
      b.Quantity AS quantity,
      b.Description AS description
    FROM Books b
    JOIN Categories c ON b.CategoryID = c.CategoryID
    WHERE c.CategoryName = 'Academic'
  `);
};

exports.getJournalBooks = async () => {
  return await db.execute(`
    SELECT 
      b.BookID AS id,
      b.ISBN AS isbn,
      b.Title AS title,
      b.Author AS author,
      b.AvailabilityStatus AS available,
      b.Rating AS rating,
      b.CoverImagePath AS coverImagePath,
      b.Publisher AS publisher,
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
      b.AvailabilityStatus AS available,
      b.Rating AS rating,
      b.CoverImagePath AS coverImagePath,
      b.Publisher AS publisher,
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

  return await db.execute(sql, params);
};

exports.getBookDetails = async (bookId) => {
  return await db.query(`
    SELECT b.*, c.CategoryName, s.SubCategoryName
    FROM Books b
    LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
    LEFT JOIN SubCategories s ON b.SubCategoryID = s.SubCategoryID
    WHERE b.BookID = ?
  `, [bookId]);
};

exports.addBook = async (book) => {
  const {
    ISBN, Title, AvailabilityStatus, Publisher, YearOfPublishment,
    CategoryID, SubCategoryID, Author, Rating, CoverImagePath,
    Description, Quantity
  } = book;

  return await db.query(
    `
    INSERT INTO Books (
      ISBN, Title, AvailabilityStatus, Publisher, YearOfPublishment,
      CategoryID, SubCategoryID, Author, Rating, CoverImagePath,
      Description, Quantity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      ISBN, Title, AvailabilityStatus, Publisher, YearOfPublishment,
      CategoryID, SubCategoryID || null, Author, Rating,
      CoverImagePath, Description, Quantity
    ]
  );
};

//Edit book
exports.editBook = async (bookId, updatedBook) => {
  const {
    ISBN, Title, AvailabilityStatus, Publisher, YearOfPublishment,
    CategoryID, SubCategoryID, Author, Rating, CoverImagePath,
    Description, Quantity
  } = updatedBook;

  return await db.query(
    `
    UPDATE Books SET
      ISBN = ?, Title = ?, AvailabilityStatus = ?, Publisher = ?, YearOfPublishment = ?,
      CategoryID = ?, SubCategoryID = ?, Author = ?, Rating = ?, CoverImagePath = ?,
      Description = ?, Quantity = ?
    WHERE BookID = ?
    `,
    [
      ISBN, Title, AvailabilityStatus, Publisher, YearOfPublishment,
      CategoryID, SubCategoryID || null, Author, Rating,
      CoverImagePath, Description, Quantity, bookId
    ]
  );
};

// Delete book (with related records)
exports.deleteBook = async (bookId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // 1. First delete all ratings for this book
    await connection.query("DELETE FROM Ratings WHERE BookID = ?", [bookId]);
    
    // 2. Then delete the book itself
    const [result] = await connection.query(
      "DELETE FROM Books WHERE BookID = ?", 
      [bookId]
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

//Update Book's Rating
exports.updateBookRating = async (bookId, averageRating) => {
  let ratingToUpdate;

  if (averageRating !== undefined) {
    ratingToUpdate = averageRating;
  } else {
    const [rows] = await db.execute(
      `SELECT AVG(RatingValue) as averageRating 
       FROM Ratings 
       WHERE BookID = ?`,
      [bookId]
    );

    ratingToUpdate = Math.round((rows[0]?.averageRating || 0) * 100) / 100;
  }

  await db.execute(
    `UPDATE Books 
     SET Rating = ?
     WHERE BookID = ?`,
    [ratingToUpdate, bookId]
  );

  return ratingToUpdate;
};

// Count books by category
exports.countBooksByCategory = async () => {
  return await db.query(`
    SELECT 
      c.CategoryName AS category,
      COUNT(*) AS count
    FROM Books b
    JOIN Categories c ON b.CategoryID = c.CategoryID
    GROUP BY c.CategoryName
  `);
};

// Count total books
exports.countAllBooks = async () => {
  return await db.query(`SELECT COUNT(*) AS total FROM Books`);
};
