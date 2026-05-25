const pool = require('../config/db');
const { ROLES, normalizeRole, isValidRole } = require('../lib/roles');

class User {
  static mapUserRow(row) {
    if (!row) return row;

    return {
      id: row.UserID,
      full_name: row.Name,
      email: row.Email,
      password: row.Password,
      role: normalizeRole(row.Role),
      created_at: row.created_at,
    };
  }

  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM Users WHERE LOWER(Email) = LOWER(?)', [email]);
    return User.mapUserRow(rows[0]);
  }

  static async create(userData) {
    const { full_name, email, password } = userData;
    const role = normalizeRole(userData.role);
    if (!isValidRole(role)) {
      throw new Error(`Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}`);
    }
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        'INSERT INTO Users (Name, Email, Password, Role) VALUES (?, ?, ?, ?)',
        [full_name, email, password, role]
      );

      await conn.query(
        'INSERT INTO UserRoleHistory (UserID, Role, StartedAt, ChangedByUserID) VALUES (?, ?, NOW(), ?)',
        [result.insertId, role, userData.changedByUserId || null]
      );

      await conn.commit();
      return result.insertId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
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
    let nextRole = null;

    if (userData.full_name != null || userData.Name != null) {
      updates.push('Name = ?');
      values.push(userData.full_name ?? userData.Name);
    }

    if (userData.email != null || userData.Email != null) {
      updates.push('Email = ?');
      values.push((userData.email ?? userData.Email).trim().toLowerCase());
    }

    if (userData.role != null || userData.Role != null) {
      nextRole = normalizeRole(userData.role ?? userData.Role);
      if (!isValidRole(nextRole)) {
        throw new Error(`Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}`);
      }
      updates.push('Role = ?');
      values.push(nextRole);
    }

    if (updates.length === 0) {
      return { affectedRows: 0 };
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [currentRows] = await conn.query('SELECT Role FROM Users WHERE UserID = ? FOR UPDATE', [id]);
      if (!currentRows.length) {
        await conn.rollback();
        return { affectedRows: 0 };
      }

      const currentRole = normalizeRole(currentRows[0].Role);
      values.push(id);
      const [result] = await conn.query(`UPDATE Users SET ${updates.join(', ')} WHERE UserID = ?`, values);

      if (nextRole && nextRole !== currentRole) {
        await conn.query(
          'UPDATE UserRoleHistory SET EndedAt = NOW() WHERE UserID = ? AND EndedAt IS NULL',
          [id]
        );
        await conn.query(
          'INSERT INTO UserRoleHistory (UserID, Role, StartedAt, ChangedByUserID) VALUES (?, ?, NOW(), ?)',
          [id, nextRole, userData.changedByUserId || null]
        );
      }

      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async getRoleHistory(id) {
    const [rows] = await pool.query(
      `SELECT
        h.RoleHistoryID,
        h.UserID,
        h.Role,
        h.StartedAt,
        h.EndedAt,
        h.ChangedByUserID,
        changer.Name AS ChangedByName
       FROM UserRoleHistory h
       LEFT JOIN Users changer ON changer.UserID = h.ChangedByUserID
       WHERE h.UserID = ?
       ORDER BY h.StartedAt ASC, h.RoleHistoryID ASC`,
      [id]
    );

    return rows.map((row) => ({
      ...row,
      Role: normalizeRole(row.Role),
    }));
  }
}

module.exports = User;
