const pool = require('../config/db');

class User {
  static mapUserRow(row) {
    if (!row) return row;

    return {
      id: row.UserID,
      full_name: row.Name,
      email: row.Email,
      password: row.Password,
      role: row.Role,
      created_at: row.created_at,
    };
  }

  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM Users WHERE LOWER(Email) = LOWER(?)', [email]);
    return User.mapUserRow(rows[0]);
  }

  static async create(userData) {
    const { full_name, email, password, role } = userData;
    const [result] = await pool.query(
      'INSERT INTO Users (Name, Email, Password, Role) VALUES (?, ?, ?, ?)',
      [full_name, email, password, role || 'Student']
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM Users WHERE UserID = ?', [id]);
    return User.mapUserRow(rows[0]);
  }

  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM Users');
    return rows.map((row) => User.mapUserRow(row));
  }

  static async deleteById(id) {
    await pool.query('DELETE FROM Users WHERE UserID = ?', [id]);
  }

  static async updateUserById(id, userData) {
    const updates = [];
    const values = [];

    if (userData.full_name != null || userData.Name != null) {
      updates.push('Name = ?');
      values.push(userData.full_name ?? userData.Name);
    }

    if (userData.email != null || userData.Email != null) {
      updates.push('Email = ?');
      values.push((userData.email ?? userData.Email).trim().toLowerCase());
    }

    if (userData.role != null || userData.Role != null) {
      updates.push('Role = ?');
      values.push(userData.role ?? userData.Role);
    }

    if (updates.length === 0) {
      return { affectedRows: 0 };
    }

    values.push(id);
    const [result] = await pool.query(`UPDATE Users SET ${updates.join(', ')} WHERE UserID = ?`, values);
    return result;
  }
}

module.exports = User;
