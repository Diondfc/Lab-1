const db = require('../config/db');

exports.getMostReadBooks = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        b.BookID,
        b.Title,
        COUNT(l.LoanID) AS ReadCount
      FROM Loans l
      JOIN Books b ON l.BookID = b.BookID
      JOIN Members m ON l.MemberID = m.MemberID
      WHERE m.IsActive = 1
      GROUP BY b.BookID, b.Title
      ORDER BY ReadCount DESC
      LIMIT 10
    `);

    res.json(rows.map((row) => ({
      BookID: row.BookID,
      Title: row.Title,
      ReadCount: Number(row.ReadCount) || 0,
    })));
  } catch (error) {
    console.error('Error fetching most-read books report:', error);
    res.status(500).json({ message: 'Failed to fetch most-read books report' });
  }
};
