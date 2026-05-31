const db = require('../config/db');

const NOTIFICATION_TYPES = Object.freeze({
  LOAN_OVERDUE: 'loan_overdue',
  LOAN_DUE_SOON: 'loan_due_soon',
  EVENT_CREATED: 'event_created',
  REQUEST_APPROVED: 'request_approved',
  MANUAL: 'manual',
});

class Notification {
  static async create({
    userId,
    title,
    message,
    type = NOTIFICATION_TYPES.MANUAL,
    loanId = null,
    referenceType = null,
    referenceId = null,
  }) {
    const [result] = await db.query(
      `INSERT INTO Notifications
       (UserID, LoanID, Title, Message, Type, ReferenceType, ReferenceID)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         Title = VALUES(Title),
         Message = VALUES(Message)`,
      [userId, loanId, title, message, type, referenceType, referenceId],
    );

    return result.insertId;
  }

  static async createForActiveUsers({
    title,
    message,
    type = NOTIFICATION_TYPES.MANUAL,
    loanId = null,
    referenceType = null,
    referenceId = null,
  }) {
    await db.query(
      `INSERT INTO Notifications
       (UserID, LoanID, Title, Message, Type, ReferenceType, ReferenceID)
       SELECT UserID, ?, ?, ?, ?, ?, ?
       FROM Users
       WHERE Status = 'Active'
       ON DUPLICATE KEY UPDATE
         Title = VALUES(Title),
         Message = VALUES(Message)`,
      [loanId, title, message, type, referenceType, referenceId],
    );
  }

  static async syncLoanReminders(userId) {
    await db.query(
      `INSERT INTO Notifications
       (UserID, LoanID, Title, Message, Type, ReferenceType, ReferenceID)
       SELECT
         l.UserID,
         l.LoanID,
         'Book overdue',
         CONCAT('The book "', l.BookTitle, '" was due on ', DATE_FORMAT(l.DueDate, '%Y-%m-%d'), '.'),
         ?,
         'Loan',
         l.LoanID
       FROM Loans l
       LEFT JOIN ReturnLoans r ON r.LoanID = l.LoanID
       WHERE l.UserID = ?
         AND r.ReturnID IS NULL
         AND l.DueDate < CURDATE()
       ON DUPLICATE KEY UPDATE
         Title = VALUES(Title),
         Message = VALUES(Message)`,
      [NOTIFICATION_TYPES.LOAN_OVERDUE, userId],
    );

    await db.query(
      `INSERT INTO Notifications
       (UserID, LoanID, Title, Message, Type, ReferenceType, ReferenceID)
       SELECT
         l.UserID,
         l.LoanID,
         'Return due soon',
         CONCAT('The book "', l.BookTitle, '" should be returned by ', DATE_FORMAT(l.DueDate, '%Y-%m-%d'), '.'),
         ?,
         'Loan',
         l.LoanID
       FROM Loans l
       LEFT JOIN ReturnLoans r ON r.LoanID = l.LoanID
       WHERE l.UserID = ?
         AND r.ReturnID IS NULL
         AND l.DueDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
       ON DUPLICATE KEY UPDATE
         Title = VALUES(Title),
         Message = VALUES(Message)`,
      [NOTIFICATION_TYPES.LOAN_DUE_SOON, userId],
    );
  }

  static async createOverdueForAll() {
    const [result] = await db.query(
      `INSERT INTO Notifications
       (UserID, LoanID, Title, Message, Type, ReferenceType, ReferenceID)
       SELECT
         l.UserID,
         l.LoanID,
         'Book overdue',
         CONCAT('The book "', l.BookTitle, '" was due on ', DATE_FORMAT(l.DueDate, '%Y-%m-%d'), '.'),
         ?,
         'Loan',
         l.LoanID
       FROM Loans l
       LEFT JOIN ReturnLoans r ON r.LoanID = l.LoanID
       JOIN Users u ON u.UserID = l.UserID
       WHERE r.ReturnID IS NULL
         AND l.DueDate < CURDATE()
         AND u.Status = 'Active'
       ON DUPLICATE KEY UPDATE
         Title = VALUES(Title),
         Message = VALUES(Message)`,
      [NOTIFICATION_TYPES.LOAN_OVERDUE],
    );

    return result.affectedRows || 0;
  }

  static async findForUser(userId) {
    const [rows] = await db.query(
      `SELECT
        NotificationID,
        UserID,
        LoanID,
        Title,
        Message,
        Type,
        ReferenceType,
        ReferenceID,
        IsRead,
        CreatedAt
       FROM Notifications
       WHERE UserID = ?
       ORDER BY IsRead ASC, CreatedAt DESC
       LIMIT 50`,
      [userId],
    );

    return rows;
  }

  static async markRead(id, userId) {
    const [result] = await db.query(
      `UPDATE Notifications
       SET IsRead = 1
       WHERE NotificationID = ? AND UserID = ?`,
      [id, userId],
    );
    return result.affectedRows;
  }

  static async markAllRead(userId) {
    const [result] = await db.query(
      `UPDATE Notifications
       SET IsRead = 1
       WHERE UserID = ? AND IsRead = 0`,
      [userId],
    );
    return result.affectedRows;
  }
}

module.exports = Notification;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
