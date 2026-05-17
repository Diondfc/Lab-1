const db = require('../config/db');

class Message {
  static async create({ room, userId, username, message, replyTo = null }) {
    try {
      const [result] = await db.query(
        'INSERT INTO Messages (room, user_id, username, content, replyTo) VALUES (?, ?, ?, ?, ?)',
        [room, userId, username, message, replyTo]
      );
      return result.insertId;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  static async getByRoom(room) {
    try {
      const [messages] = await db.query(
        `SELECT id, room, user_id as userId, username, 
         content as message, created_at as timestamp
         FROM Messages 
         WHERE room = ? 
         ORDER BY created_at ASC`,
        [room]
      );
      return messages || [];
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  static async update(id, userId, newContent) {
    try {
      // Verify ownership before update
      const [message] = await db.query(
        'SELECT user_id FROM Messages WHERE id = ?',
        [id]
      );
      
      if (!message.length || message[0].user_id !== userId) {
        throw new Error('Message not found or not authorized');
      }

      const [result] = await db.query(
        'UPDATE Messages SET content = ? WHERE id = ?',
        [newContent, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Message update error:', error);
      throw error;
    }
  }
  
  static async delete(id, userId) {
    try {
      // Verify ownership before deletion
      const [message] = await db.query(
        'SELECT user_id FROM Messages WHERE id = ?',
        [id]
      );
      
      if (!message.length || message[0].user_id !== userId) {
        throw new Error('Message not found or not authorized');
      }

      const [result] = await db.query(
        'DELETE FROM Messages WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Message deletion error:', error);
      throw error;
    }
  }

  static async getCount() {
    try {
      const [result] = await db.query('SELECT COUNT(*) as total FROM Messages');
      return result[0].total;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
}

module.exports = Message;