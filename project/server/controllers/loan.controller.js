const pool = require('../config/db');
const Loan = require('../models/loan.model'); 

exports.createLoan = async (req, res) => {
  try {
    const { bookId,bookTitle, userId, userName, startDate, dueDate } = req.body;
    
    if (!bookId || !bookTitle || !userId || !userName || !startDate || !dueDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const connection = await pool.getConnection();
    
    try {
      // Check if book exists and has available quantity
      const [book] = await connection.execute(
        'SELECT * FROM Books WHERE BookID = ? AND Quantity > 0',
        [bookId]
      );
      
      if (book.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Book not found or no available copies' 
        });
      }

      // Check if user exists
      const [user] = await connection.execute(
        'SELECT * FROM Users WHERE UserID = ?',
        [userId]
      );
      
      if (user.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Create the loan
      const [result] = await connection.execute(
        `INSERT INTO Loans 
         (BookID,BookTitle, UserID, UserName, StartDate, DueDate) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [bookId,bookTitle, userId, userName, startDate, dueDate]
      );

      // Update book status and decrement quantity
      await connection.execute(
        `UPDATE Books 
         SET AvailabilityStatus = CASE WHEN Quantity - 1 <= 0 THEN 'Checked Out' ELSE AvailabilityStatus END,
             Quantity = Quantity - 1 
         WHERE BookID = ?`,
        [bookId]
      );
      
      res.status(201).json({
        success: true,
        message: 'Loan created successfully',
        loanId: result.insertId
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create loan',
      error: error.message
    });
  }
};

exports.getAllLoans = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [loans] = await connection.execute(`
        SELECT 
          l.LoanID,
          l.BookID,
          l.BookTitle,
          l.UserID,
          l.UserName,
          DATE(l.StartDate) as StartDate,
          DATE(l.DueDate) as DueDate,
          DATE(r.ReturnDate) as ReturnDate,
          r.Conditions,
          r.Notes,
          r.FineAmount,
          CASE 
            WHEN r.ReturnDate IS NOT NULL THEN 'returned'  /* Changed from ReturnID to ReturnDate */
            WHEN l.DueDate < CURDATE() THEN 'overdue'
            ELSE 'active'
          END as status
        FROM Loans l
        LEFT JOIN ReturnLoans r ON l.LoanID = r.LoanID
        ORDER BY l.StartDate DESC
      `);
      
      res.status(200).json({ success: true, data: loans });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch loans',
      error: error.message
    });
  }
};


exports.getUserLoans = async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    
    try {
      const [loans] = await connection.execute(`
        SELECT 
          l.LoanID as id,
          l.BookID,
          l.BookTitle,
          l.UserID,
          l.UserName,
          DATE(l.StartDate) as startDate,
          DATE(l.DueDate) as dueDate,
          DATE(r.ReturnDate) as returnDate,
          r.Conditions,
          r.Notes,
          r.FineAmount as FineAmount,
          CASE 
            WHEN r.ReturnDate IS NOT NULL THEN 'returned'
            WHEN l.DueDate < CURDATE() THEN 'overdue'
            ELSE 'active'
          END as status
        FROM Loans l
        LEFT JOIN ReturnLoans r ON l.LoanID = r.LoanID
        WHERE l.UserID = ?
        ORDER BY l.StartDate DESC
      `, [userId]);
      
      res.status(200).json({
        success: true,
        data: loans
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching user loans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user loans',
      error: error.message
    });
  }
};

exports.deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // First delete any return record
      await connection.execute(
        `DELETE FROM ReturnLoans WHERE LoanID=?`,
        [id]
      );
   
      // Get the book ID before deleting the loan
      const [loan] = await connection.execute(
        `SELECT BookID FROM Loans WHERE LoanID=?`,
        [id]
      );
      
      // Delete the loan record
      await connection.execute(
        `DELETE FROM Loans WHERE LoanID=?`,
        [id]
      );

      // Update book availability and quantity if loan existed
      if(loan.length > 0){
        await connection.execute(
          `UPDATE Books 
           SET AvailabilityStatus = CASE WHEN Quantity + 1 > 0 THEN 'Available' ELSE AvailabilityStatus END,
               Quantity = Quantity + 1 
           WHERE BookID=?`,
          [loan[0].BookID]
        );
      }
      
      await connection.commit();
      res.json({ success: true });
    } catch(error){
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete loan',
      error: error.message
    });
  }
};

exports.getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    try {
      const [loan] = await connection.execute(
        `SELECT * FROM Loans WHERE LoanID = ?`,
        [id]
      );
      
      if (loan.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found'
        });
      }
      
      res.json(loan[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan',
      error: error.message
    });
  }
};

exports.getTotalLoansCount = async (req, res) => {
  try {
    const count = await Loan.getTotalCount();
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to count total loans',
      error: error.message 
    });
  }
};