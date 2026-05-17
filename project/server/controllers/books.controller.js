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

exports.createBook = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Cover image is required' });
    }

    const {
      ISBN,
      Title,
      AvailabilityStatus,
      Publisher,
      YearOfPublishment,
      CategoryID,
      SubCategoryID,
      Author,
      Rating,
      Description,
      Quantity,
    } = req.body;

    const required = {
      ISBN,
      Title,
      Publisher,
      YearOfPublishment,
      CategoryID,
      Author,
      Rating,
      Description,
      Quantity,
    };

    const missing = Object.entries(required)
      .filter(([, value]) => value === undefined || value === null || String(value).trim() === '')
      .map(([key]) => key);

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    if (String(CategoryID) === '3' && (!SubCategoryID || String(SubCategoryID).trim() === '')) {
      return res.status(400).json({ message: 'Genre is required for novels' });
    }

    const year = parseInt(YearOfPublishment, 10);
    const quantity = parseInt(Quantity, 10);
    const rating = parseFloat(Rating);

    if (Number.isNaN(year) || Number.isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid year or quantity' });
    }

    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }

    const subCategory =
      SubCategoryID && String(SubCategoryID).trim() !== '' ? SubCategoryID : null;

    const coverImage = req.file.filename;

    const [result] = await pool.execute(
      `INSERT INTO Books (
        ISBN, Title, AvailabilityStatus, Publisher, YearOfPublishment,
        CategoryID, SubCategoryID, Author, Rating, Description, Quantity, CoverImage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ISBN.trim(),
        Title.trim(),
        AvailabilityStatus || 'Available',
        Publisher.trim(),
        year,
        CategoryID,
        subCategory,
        Author.trim(),
        rating,
        Description.trim(),
        quantity,
        coverImage,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM Books WHERE BookID = ?', [
      result.insertId,
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating book:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'A book with this ISBN already exists' });
    }

    res.status(500).json({ message: 'Server error' });
  }
};
