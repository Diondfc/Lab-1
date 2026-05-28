const db = require('../config/db');

class Request {
  static async create({ userId, username, book_title, book_author, room }) {
    // Optional: Check for duplicate requests
    const [existing] = await db.query(
      `SELECT id FROM BookRequests 
       WHERE user_id = ? AND book_title = ? AND room = ?`,
      [userId, book_title, room]
    );
    
    if (existing.length > 0) {
      throw new Error('You already requested this book in this room');
    }
  
    const [result] = await db.query(
      'INSERT INTO BookRequests (user_id, username, book_title, book_author, room, Status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, book_title, book_author, room, 'Pending']
    );
    return { id: result.insertId, userId, username, book_title, book_author, room, Status: 'Pending' };
  }

  static async getByRoom(room) {
    const [requests] = await db.query(
      'SELECT * FROM BookRequests WHERE room = ? ORDER BY created_at DESC',
      [room]
    );
    return requests;
  }

  static async update(id, userId, { book_title, book_author }) {
    const [result] = await db.query(
      'UPDATE BookRequests SET book_title = ?, book_author = ? WHERE id = ? AND user_id = ?',
      [book_title, book_author, id, userId]
    );
    if (result.affectedRows === 0) {
      throw new Error('Request not found or not authorized');
    }
    
    // Return the updated request
    const [updatedRequest] = await db.query(
      'SELECT * FROM BookRequests WHERE id = ?',
      [id]
    );
    return updatedRequest[0];
  }

  static async updateStatus(id, status) {
    const [result] = await db.query(
      "UPDATE BookRequests SET Status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Request not found');
    }

    const [updatedRequest] = await db.query(
      'SELECT * FROM BookRequests WHERE id = ?',
      [id]
    );
    return updatedRequest[0];
  }

  static async delete(id, userId) {
    const [request] = await db.query(
      'SELECT id FROM BookRequests WHERE id = ? AND user_id = ?',
      [id, userId],
    );

    if (!request.length) {
      const [exists] = await db.query(
        'SELECT id FROM BookRequests WHERE id = ?',
        [id],
      );

      if (!exists.length) {
        throw new Error('Request not found');
      }
      throw new Error('Not authorized to delete this request');
    }

    const [result] = await db.query('DELETE FROM BookRequests WHERE id = ?', [
      id,
    ]);

    return result.affectedRows > 0;
  }
}

module.exports = Request;
