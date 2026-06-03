const pool = require('../config/db');
const Reservation = require('../models/reservations.model');

const calculateFine = (dueDate, returnDate) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  const diffDays = Math.max(0, Math.floor((returned - due) / (1000 * 60 * 60 * 24)));
  return diffDays * 0.50; // $0.50 per day fine
};

async function ensureReservationsTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS Reservations (
      ReservationID INT UNSIGNED NOT NULL AUTO_INCREMENT,
      BookID INT UNSIGNED NOT NULL,
      MemberID INT UNSIGNED NOT NULL,
      ReservedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ExpiresAt DATETIME NULL,
      Status ENUM('Active','Fulfilled','Cancelled','Expired') NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (ReservationID),
      KEY idx_res_book (BookID),
      KEY idx_res_member (MemberID),
      CONSTRAINT fk_res_book FOREIGN KEY (BookID) REFERENCES Books (BookID) ON DELETE CASCADE,
      CONSTRAINT fk_res_member FOREIGN KEY (MemberID) REFERENCES Members (MemberID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

exports.processReturn = async (req, res) => {
  try {
    const { loanId, bookId, userId, returnDate, condition, notes } = req.body;

    if ((!loanId && (!bookId || !userId)) || !returnDate || !condition) {
      return res.status(400).json({ 
        success: false, 
        message: 'Loan, return date and book condition are required'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const loanWhere = loanId ? 'l.LoanID = ?' : 'l.BookID = ? AND l.UserID = ?';
      const loanParams = loanId ? [loanId] : [bookId, userId];
      const [activeLoan] = await connection.execute(
        `SELECT
           l.LoanID,
           l.BookID,
           l.UserID,
           l.DueDate,
           r.ReturnID
         FROM Loans l
         LEFT JOIN ReturnLoans r ON r.LoanID = l.LoanID
         WHERE ${loanWhere}
         ORDER BY l.StartDate DESC
         LIMIT 1`,
        loanParams,
      );

      if (!activeLoan.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Loan not found'
        });
      }

      if (activeLoan[0].ReturnID) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'This loan has already been returned'
        });
      }

      const returnBookId = activeLoan[0].BookID;
      const returnUserId = activeLoan[0].UserID;

      // Calculate fine amount
      const fineAmount = calculateFine(activeLoan[0].DueDate, returnDate);

      // Create return record
      const [result] = await connection.execute(
        `INSERT INTO ReturnLoans 
         (LoanID, BookID, UserID, ReturnDate, Conditions, Notes, FineAmount) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [activeLoan[0].LoanID, returnBookId, returnUserId, returnDate, condition, notes || null, fineAmount]
      );

      let fineId = null;

      // Update book status and increment quantity
      await connection.execute(
        `UPDATE Books 
         SET Quantity = GREATEST(COALESCE(Quantity, 0), 0) + 1,
             AvailabilityStatus = 'Available'
         WHERE BookID = ?`,
        [returnBookId]
      );

      if (fineAmount > 0) {
        const [fineResult] = await connection.execute(
          `INSERT INTO Fines (ReturnID, LoanID, UserID, Amount, Status)
           VALUES (?, ?, ?, ?, 'Unpaid')
           ON DUPLICATE KEY UPDATE Amount = VALUES(Amount), Status = 'Unpaid'`,
          [result.insertId, activeLoan[0].LoanID, returnUserId, fineAmount]
        );
        fineId = fineResult.insertId || fineId;
      }

      let nextReservation = null;
      let reservationQueue = [];

      try {
        await ensureReservationsTable(connection);
        const [nextReservations] = await connection.execute(
          `SELECT
            r.ReservationID,
            r.BookID,
            r.MemberID,
            m.UserID,
            u.Name AS UserName,
            u.Email AS UserEmail,
            r.ReservedAt
           FROM Reservations r
           JOIN Members m ON m.MemberID = r.MemberID
           JOIN Users u ON u.UserID = m.UserID
           WHERE r.BookID = ? AND r.Status = 'Active'
           ORDER BY r.ReservedAt ASC, r.ReservationID ASC
           LIMIT 1`,
          [returnBookId],
        );
        nextReservation = nextReservations[0] || null;
      } catch (reservationError) {
        console.error('Reservation check warning:', reservationError.message);
      }

      await connection.commit();

      try {
        reservationQueue = await Reservation.getByBookId(returnBookId);
      } catch (reservationQueueError) {
        console.error('Reservation queue warning:', reservationQueueError.message);
      }

      res.status(200).json({
        success: true,
        message: 'Return processed successfully',
        returnDate: returnDate,
        fineAmount: fineAmount,
        fineId,
        nextReservation,
        reservationQueue,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error processing return:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'This loan has already been returned',
        error: error.message,
      });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Return could not be saved because the loan, book, or user reference is missing',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to process return',
      error: error.message
    });
  }
};

exports.calculateFine = calculateFine;
