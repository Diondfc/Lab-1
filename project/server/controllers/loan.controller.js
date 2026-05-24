const pool = require('../config/db');
const Loan = require('../models/loan.model');
const { getUserId, isStaffRole } = require('../middlewares/auth');

exports.createLoan = async (req, res) => {
  try {
    const { bookId, bookTitle, userId, userName, startDate, dueDate, paymentStatus, paymentAmount, paymentMethod } = req.body;

    if (!bookId || !bookTitle || !userId || !userName || !startDate || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const callerId = Number(getUserId(req));
    const targetUserId = Number(userId);
    if (!isStaffRole(req.user?.role) && callerId !== targetUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create loans for your own account',
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [book] = await connection.execute(
        'SELECT BookID, Quantity FROM Books WHERE BookID = ? FOR UPDATE',
        [bookId]
      );

      if (book.length === 0 || book[0].Quantity <= 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Book not found or no available copies'
        });
      }

      const [user] = await connection.execute(
        'SELECT UserID FROM Users WHERE UserID = ?',
        [userId]
      );

      if (user.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const [result] = await connection.execute(
        `INSERT INTO Loans
         (BookID, BookTitle, UserID, UserName, StartDate, DueDate, PaymentStatus, PaymentAmount, PaymentMethod, PaymentDate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookId,
          bookTitle,
          userId,
          userName,
          startDate,
          dueDate,
          paymentStatus || 'Paid',
          paymentAmount || 0.00,
          paymentMethod || 'Mock Wallet',
          (paymentStatus || 'Paid') === 'Paid' ? new Date() : null
        ]
      );

      await connection.execute(
        `UPDATE Books
         SET AvailabilityStatus = CASE WHEN Quantity - 1 <= 0 THEN 'Checked Out' ELSE AvailabilityStatus END,
             Quantity = Quantity - 1
         WHERE BookID = ?`,
        [bookId]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Loan created successfully',
        loanId: result.insertId
      });
    } catch (error) {
      await connection.rollback();
      throw error;
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
          l.PaymentStatus,
          l.PaymentAmount,
          l.PaymentMethod,
          DATE(l.PaymentDate) as PaymentDate,
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
          l.PaymentStatus,
          l.PaymentAmount,
          l.PaymentMethod,
          DATE(l.PaymentDate) as paymentDate,
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

      const [loanRows] = await connection.execute(
        `SELECT BookID FROM Loans WHERE LoanID = ? FOR UPDATE`,
        [id]
      );

      if (loanRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Loan not found' });
      }

      const bookId = loanRows[0].BookID;

      const [returnRows] = await connection.execute(
        `SELECT ReturnID FROM ReturnLoans WHERE LoanID = ?`,
        [id]
      );

      const wasReturned = returnRows.length > 0;

      await connection.execute(
        `DELETE FROM ReturnLoans WHERE LoanID = ?`,
        [id]
      );

      await connection.execute(
        `DELETE FROM Loans WHERE LoanID = ?`,
        [id]
      );

      if (!wasReturned) {
        await connection.execute(
          `UPDATE Books
           SET AvailabilityStatus = CASE WHEN Quantity + 1 > 0 THEN 'Available' ELSE AvailabilityStatus END,
               Quantity = Quantity + 1
           WHERE BookID = ?`,
          [bookId]
        );
      }

      await connection.commit();
      res.json({ success: true });
    } catch (error) {
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

      const callerId = Number(getUserId(req));
      if (
        !isStaffRole(req.user?.role) &&
        Number(loan[0].UserID) !== callerId
      ) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
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