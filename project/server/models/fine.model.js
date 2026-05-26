const db = require('../config/db');

const fineSelect = `
  SELECT
    f.FineID,
    f.ReturnID,
    f.LoanID,
    f.UserID,
    f.Amount,
    f.Status,
    f.PaymentMethod,
    f.PaymentReference,
    DATE(f.PaidAt) as PaidAt,
    DATE(f.WaivedAt) as WaivedAt,
    f.Notes as FineNotes,
    DATE(f.created_at) as CreatedAt,
    l.BookID,
    l.BookTitle,
    l.UserName,
    DATE(l.StartDate) as StartDate,
    DATE(l.DueDate) as DueDate,
    DATE(r.ReturnDate) as ReturnDate,
    r.Conditions,
    r.Notes as ReturnNotes,
    r.FineAmount
  FROM Fines f
  JOIN Loans l ON f.LoanID = l.LoanID
  JOIN ReturnLoans r ON f.ReturnID = r.ReturnID
`;

class Fine {
  static async findAll({ status } = {}) {
    const params = [];
    let where = '';

    if (status) {
      where = 'WHERE f.Status = ?';
      params.push(status);
    }

    const [rows] = await db.execute(
      `${fineSelect} ${where} ORDER BY f.created_at DESC`,
      params
    );
    return rows;
  }

  static async findByUser(userId, { status } = {}) {
    const params = [userId];
    let where = 'WHERE f.UserID = ?';

    if (status) {
      where += ' AND f.Status = ?';
      params.push(status);
    }

    const [rows] = await db.execute(
      `${fineSelect} ${where} ORDER BY f.created_at DESC`,
      params
    );
    return rows;
  }

  static async findById(fineId) {
    const [rows] = await db.execute(
      `${fineSelect} WHERE f.FineID = ? LIMIT 1`,
      [fineId]
    );
    return rows[0] || null;
  }

  static async markPaid(fineId, { paymentMethod, paymentReference, notes }) {
    const [result] = await db.execute(
      `UPDATE Fines
       SET Status = 'Paid',
           PaymentMethod = ?,
           PaymentReference = ?,
           PaidAt = CURRENT_TIMESTAMP,
           WaivedAt = NULL,
           Notes = COALESCE(?, Notes)
       WHERE FineID = ? AND Status = 'Unpaid'`,
      [paymentMethod || 'Library Payment', paymentReference || null, notes || null, fineId]
    );
    return result.affectedRows;
  }

  static async updateStatus(fineId, { status, notes }) {
    if (status === 'Paid') {
      return this.markPaid(fineId, { notes });
    }

    if (status === 'Waived') {
      const [result] = await db.execute(
        `UPDATE Fines
         SET Status = 'Waived',
             PaidAt = NULL,
             WaivedAt = CURRENT_TIMESTAMP,
             Notes = COALESCE(?, Notes)
         WHERE FineID = ? AND Status <> 'Paid'`,
        [notes || null, fineId]
      );
      return result.affectedRows;
    }

    const [result] = await db.execute(
      `UPDATE Fines
       SET Status = 'Unpaid',
           PaymentMethod = NULL,
           PaymentReference = NULL,
           PaidAt = NULL,
           WaivedAt = NULL,
           Notes = COALESCE(?, Notes)
       WHERE FineID = ?`,
      [notes || null, fineId]
    );
    return result.affectedRows;
  }
}

module.exports = Fine;
