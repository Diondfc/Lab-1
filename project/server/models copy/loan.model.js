const db = require('../config/db'); 

class Loan {
  static async getTotalCount() {
    try {
      const [result] = await db.query(`
        SELECT COUNT(*) as total 
        FROM Loans
      `);
      return result[0].total;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
}

module.exports = Loan;