const path = require('path');
const Book = require('../models/book.model');

function coverPathFromFile(file) {
  if (!file) return null;
  return path.join('uploads', file.filename).replace(/\\/g, '/');
}

exports.getAllBooks = async (_req, res) => {
  try {
    const books = await Book.getAllBooks();
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAcademicBooks = async (_req, res) => {
  try {
    const books = await Book.getAcademicBooks();
    res.json(books);
  } catch (error) {
    console.error('Error fetching academic books:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getJournalBooks = async (_req, res) => {
  try {
    const books = await Book.getJournalBooks();
    res.json(books);
  } catch (error) {
    console.error('Error fetching journal books:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNovelBooks = async (req, res) => {
  try {
    const { subcategory } = req.query;
    const books = await Book.getNovelBooks(subcategory);
    res.json(books);
  } catch (error) {
    console.error('Error fetching novel books:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.getBookById(id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addBook = async (req, res) => {
  try {
    const body = req.body;
    const coverImagePath =
      coverPathFromFile(req.file) || body.CoverImagePath || '';

    const bookId = await Book.addBook({
      ISBN: body.ISBN,
      Title: body.Title,
      AvailabilityStatus: body.AvailabilityStatus || 'Available',
      Publisher: body.Publisher || null,
      YearOfPublishment: body.YearOfPublishment || null,
      CategoryID: Number(body.CategoryID),
      SubCategoryID: body.SubCategoryID ? Number(body.SubCategoryID) : null,
      Author: body.Author,
      Rating: body.Rating ?? 0,
      CoverImagePath: coverImagePath,
      Description: body.Description || '',
      Quantity: Number(body.Quantity) || 1,
    });

    const book = await Book.getBookById(bookId);
    res.status(201).json(book);
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ message: 'Error adding book', error: error.message });
  }
};

exports.editBook = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Book.getBookById(id);

    if (!existing) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const body = req.body;
    const coverImagePath =
      coverPathFromFile(req.file) || body.CoverImagePath || existing.CoverImagePath;

    await Book.editBook(id, {
      ISBN: body.ISBN ?? existing.ISBN,
      Title: body.Title ?? existing.Title,
      AvailabilityStatus:
        body.AvailabilityStatus ?? existing.AvailabilityStatus,
      Publisher: body.Publisher ?? existing.Publisher,
      YearOfPublishment:
        body.YearOfPublishment ?? existing.YearOfPublishment,
      CategoryID: Number(body.CategoryID ?? existing.CategoryID),
      SubCategoryID: body.SubCategoryID
        ? Number(body.SubCategoryID)
        : existing.SubCategoryID,
      Author: body.Author ?? existing.Author,
      Rating: body.Rating ?? existing.Rating,
      CoverImagePath: coverImagePath,
      Description: body.Description ?? existing.Description,
      Quantity: Number(body.Quantity ?? existing.Quantity),
    });

    const book = await Book.getBookById(id);
    res.json(book);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Error updating book', error: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Book.deleteBook(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Error deleting book' });
  }
};
