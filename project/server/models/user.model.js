const pool = require('../config/db');
const { ROLES, normalizeRole, isValidRole } = require('../lib/roles');

const USER_STATUSES = Object.freeze({
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
});

function normalizeStatus(status) {
  if (status === 'active') return USER_STATUSES.ACTIVE;
  if (status === 'inactive') return USER_STATUSES.INACTIVE;
  return status || USER_STATUSES.ACTIVE;
}

function isValidStatus(status) {
  return Object.values(USER_STATUSES).includes(status);
}

class User {
  static mapUserRow(row) {
    if (!row) return row;

    return {
      id: row.UserID,
      full_name: row.Name,
      email: row.Email,
      password: row.Password,
      role: normalizeRole(row.Role),
      status: normalizeStatus(row.Status),
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
    const status = normalizeStatus(userData.status || userData.Status);
    if (!isValidRole(role)) {
      throw new Error(`Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}`);
    }
    if (!isValidStatus(status)) {
      throw new Error(`Invalid status. Allowed statuses: ${Object.values(USER_STATUSES).join(', ')}`);
    }
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        'INSERT INTO Users (Name, Email, Password, Role, Status) VALUES (?, ?, ?, ?, ?)',
        [full_name, email, password, role, status]
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
    const [rows] = await pool.query('SELECT * FROM Users ORDER BY created_at DESC, UserID DESC');
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

    if (userData.status != null || userData.Status != null) {
      const status = normalizeStatus(userData.status ?? userData.Status);
      if (!isValidStatus(status)) {
        throw new Error(`Invalid status. Allowed statuses: ${Object.values(USER_STATUSES).join(', ')}`);
      }
      updates.push('Status = ?');
      values.push(status);
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

  static async setStatus(id, status) {
    const normalizedStatus = normalizeStatus(status);
    if (!isValidStatus(normalizedStatus)) {
      throw new Error(`Invalid status. Allowed statuses: ${Object.values(USER_STATUSES).join(', ')}`);
    }

    const [result] = await pool.query(
      'UPDATE Users SET Status = ? WHERE UserID = ?',
      [normalizedStatus, id]
    );
    return result;
  }
}

module.exports = User;
module.exports.USER_STATUSES = USER_STATUSES;
