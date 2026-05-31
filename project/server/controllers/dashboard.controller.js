const db = require('../config/db');

exports.getStats = async (_req, res) => {
  try {
    const [[borrowedBooksRow]] = await db.query(`
      SELECT COUNT(*) AS borrowedBooks
      FROM Loans l
      LEFT JOIN ReturnLoans r ON l.LoanID = r.LoanID
      WHERE r.ReturnID IS NULL
    `);

    const [[activeMembersRow]] = await db.query(`
      SELECT COUNT(*) AS activeMembers
      FROM Members
      WHERE IsActive = 1
    `);

    const [[overdueLoansRow]] = await db.query(`
      SELECT COUNT(*) AS overdueLoans
      FROM Loans l
      LEFT JOIN ReturnLoans r ON l.LoanID = r.LoanID
      WHERE r.ReturnID IS NULL
        AND l.DueDate < CURDATE()
    `);

    const [[totalBooksRow]] = await db.query(`
      SELECT COUNT(*) AS totalBooks
      FROM Books
    `);

    res.json({
      borrowedBooks: Number(borrowedBooksRow.borrowedBooks) || 0,
      activeMembers: Number(activeMembersRow.activeMembers) || 0,
      overdueLoans: Number(overdueLoansRow.overdueLoans) || 0,
      totalBooks: Number(totalBooksRow.totalBooks) || 0,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};
