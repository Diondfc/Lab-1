const db = require('../config/db');

class UserAccount {
  static async create(userId) {
    await db.query('INSERT IGNORE INTO useraccount (UserID) VALUES (?)', [userId]);
  }

  static async findByUserId(userId) {
    const [rows] = await db.query(
      'SELECT * FROM useraccount WHERE UserID = ?',
      [userId],
    );
    return rows[0] || null;
  }
}

module.exports = UserAccount;
