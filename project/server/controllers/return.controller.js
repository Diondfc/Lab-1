const pool = require('../config/db');

const calculateFine = (dueDate, returnDate) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  const diffDays = Math.max(0, Math.floor((returned - due) / (1000 * 60 * 60 * 24)));
  return diffDays * 0.50; // $0.50 per day fine
};

exports.processReturn = async (req, res) => {
  try {
    const { bookId, userId, returnDate, condition, notes } = req.body;

    if (!bookId || !userId || !returnDate || !condition) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Find active loan
      const [activeLoan] = await connection.execute(
        `SELECT LoanID, DueDate FROM Loans 
         WHERE BookID = ? AND UserID = ? 
         AND LoanID NOT IN (SELECT LoanID FROM ReturnLoans)
         ORDER BY StartDate DESC LIMIT 1`,
        [bookId, userId]
      );

      if (!activeLoan.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'No active loan found'
        });
      }

      // Calculate fine amount
      const fineAmount = calculateFine(activeLoan[0].DueDate, returnDate);

      // Create return record
      const [result] = await connection.execute(
        `INSERT INTO ReturnLoans 
         (LoanID, BookID, UserID, ReturnDate, Conditions, Notes, FineAmount) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [activeLoan[0].LoanID, bookId, userId, returnDate, condition, notes, fineAmount]
      );

      let fineId = null;

      // Update book status and increment quantity
      await connection.execute(
        `UPDATE Books 
         SET Quantity = Quantity + 1,
             AvailabilityStatus = CASE WHEN Quantity + 1 > 0 THEN 'Available' ELSE AvailabilityStatus END
         WHERE BookID = ?`,
        [bookId]
      );

      if (fineAmount > 0) {
        const [fineResult] = await connection.execute(
          `INSERT INTO Fines (ReturnID, LoanID, UserID, Amount, Status)
           VALUES (?, ?, ?, ?, 'Unpaid')
           ON DUPLICATE KEY UPDATE Amount = VALUES(Amount), Status = 'Unpaid'`,
          [result.insertId, activeLoan[0].LoanID, userId, fineAmount]
        );
        fineId = fineResult.insertId || fineId;
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: 'Return processed successfully',
        returnDate: returnDate,
        fineAmount: fineAmount,
        fineId
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process return',
      error: error.message
    });
  }
};

exports.calculateFine = calculateFine;
