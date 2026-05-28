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
      first_name: row.FirstName,
      last_name: row.LastName,
      email: row.Email,
      phone_number: row.PhoneNumber,
      email_confirmed: Boolean(row.EmailConfirmed),
      lockout_enabled: Boolean(row.LockoutEnabled),
      access_failed_count: row.AccessFailedCount,
      password: row.PasswordHash || row.Password,
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
    const firstName = userData.first_name ?? userData.FirstName ?? null;
    const lastName = userData.last_name ?? userData.LastName ?? null;
    const phoneNumber = userData.phone_number ?? userData.PhoneNumber ?? null;
    const emailConfirmed = userData.email_confirmed ?? userData.EmailConfirmed ?? 0;
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
        'INSERT INTO Users (Name, FirstName, LastName, Email, PhoneNumber, EmailConfirmed, Password, PasswordHash, Role, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [full_name, firstName, lastName, email, phoneNumber, emailConfirmed ? 1 : 0, password, password, role, status]
      );

      await conn.query(
        `INSERT INTO UserRoles (UserID, RoleID, AssignedAt, AssignedByUserID)
         SELECT ?, RoleID, NOW(), ? FROM Roles WHERE Name = ?`,
        [result.insertId, userData.changedByUserId || null, role]
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

    if (userData.first_name != null || userData.FirstName != null) {
      updates.push('FirstName = ?');
      values.push(userData.first_name ?? userData.FirstName);
    }

    if (userData.last_name != null || userData.LastName != null) {
      updates.push('LastName = ?');
      values.push(userData.last_name ?? userData.LastName);
    }

    if (userData.phone_number != null || userData.PhoneNumber != null) {
      updates.push('PhoneNumber = ?');
      values.push(userData.phone_number ?? userData.PhoneNumber);
    }

    if (userData.email_confirmed != null || userData.EmailConfirmed != null) {
      updates.push('EmailConfirmed = ?');
      values.push((userData.email_confirmed ?? userData.EmailConfirmed) ? 1 : 0);
    }

    if (userData.lockout_enabled != null || userData.LockoutEnabled != null) {
      updates.push('LockoutEnabled = ?');
      values.push((userData.lockout_enabled ?? userData.LockoutEnabled) ? 1 : 0);
    }

    if (userData.access_failed_count != null || userData.AccessFailedCount != null) {
      updates.push('AccessFailedCount = ?');
      values.push(Number(userData.access_failed_count ?? userData.AccessFailedCount));
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
          'UPDATE UserRoles SET RemovedAt = NOW() WHERE UserID = ? AND RemovedAt IS NULL',
          [id]
        );
        await conn.query(
          `INSERT INTO UserRoles (UserID, RoleID, AssignedAt, AssignedByUserID)
           SELECT ?, RoleID, NOW(), ? FROM Roles WHERE Name = ?`,
          [id, userData.changedByUserId || null, nextRole]
        );
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

  static async getRoles(id) {
    const [rows] = await pool.query(
      `SELECT ur.UserRoleID, ur.UserID, ur.RoleID, r.Name AS Role, r.Description, r.NormalizedName,
              ur.AssignedAt, ur.RemovedAt, ur.AssignedByUserID
       FROM UserRoles ur
       JOIN Roles r ON r.RoleID = ur.RoleID
       WHERE ur.UserID = ?
       ORDER BY ur.RemovedAt IS NULL DESC, ur.AssignedAt DESC, ur.UserRoleID DESC`,
      [id]
    );

    return rows.map((row) => ({
      ...row,
      Role: normalizeRole(row.Role),
    }));
  }

  static async assignRole(id, role, assignedByUserId = null) {
    const normalizedRole = normalizeRole(role);
    if (!isValidRole(normalizedRole)) {
      throw new Error(`Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}`);
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [existingActive] = await conn.query(
        `SELECT ur.UserRoleID
         FROM UserRoles ur
         JOIN Roles r ON r.RoleID = ur.RoleID
         WHERE ur.UserID = ? AND r.Name = ? AND ur.RemovedAt IS NULL
         FOR UPDATE`,
        [id, normalizedRole]
      );

      if (!existingActive.length) {
        await conn.query(
          `INSERT INTO UserRoles (UserID, RoleID, AssignedAt, AssignedByUserID)
           SELECT ?, RoleID, NOW(), ? FROM Roles WHERE Name = ?`,
          [id, assignedByUserId || null, normalizedRole]
        );
      }

      await conn.query('UPDATE Users SET Role = ? WHERE UserID = ?', [normalizedRole, id]);
      await User.recordRoleHistory(conn, id, normalizedRole, assignedByUserId);

      await conn.commit();
      return User.getRoles(id);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async removeRole(id, role, changedByUserId = null) {
    const normalizedRole = normalizeRole(role);
    if (!isValidRole(normalizedRole)) {
      throw new Error(`Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}`);
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE UserRoles ur
         JOIN Roles r ON r.RoleID = ur.RoleID
         SET ur.RemovedAt = NOW()
         WHERE ur.UserID = ? AND r.Name = ? AND ur.RemovedAt IS NULL`,
        [id, normalizedRole]
      );

      const [activeRoles] = await conn.query(
        `SELECT r.Name AS Role
         FROM UserRoles ur
         JOIN Roles r ON r.RoleID = ur.RoleID
         WHERE ur.UserID = ? AND ur.RemovedAt IS NULL
         ORDER BY FIELD(r.Name, 'Admin', 'Manager', 'User/Member'), ur.AssignedAt DESC
         LIMIT 1`,
        [id]
      );
      const nextRole = normalizeRole(activeRoles[0]?.Role || ROLES.USER_MEMBER);

      const [remainingDefault] = await conn.query(
        `SELECT ur.UserRoleID
         FROM UserRoles ur
         JOIN Roles r ON r.RoleID = ur.RoleID
         WHERE ur.UserID = ? AND r.Name = ? AND ur.RemovedAt IS NULL`,
        [id, nextRole]
      );
      if (!remainingDefault.length) {
        await conn.query(
          `INSERT INTO UserRoles (UserID, RoleID, AssignedAt, AssignedByUserID)
           SELECT ?, RoleID, NOW(), ? FROM Roles WHERE Name = ?`,
          [id, changedByUserId || null, nextRole]
        );
      }

      await conn.query('UPDATE Users SET Role = ? WHERE UserID = ?', [nextRole, id]);
      await User.recordRoleHistory(conn, id, nextRole, changedByUserId);

      await conn.commit();
      return User.getRoles(id);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async recordRoleHistory(conn, id, nextRole, changedByUserId = null) {
    const [currentRows] = await conn.query(
      'SELECT Role FROM UserRoleHistory WHERE UserID = ? AND EndedAt IS NULL ORDER BY StartedAt DESC, RoleHistoryID DESC LIMIT 1',
      [id]
    );
    const currentRole = normalizeRole(currentRows[0]?.Role);

    if (currentRole === nextRole) return;

    await conn.query(
      'UPDATE UserRoleHistory SET EndedAt = NOW() WHERE UserID = ? AND EndedAt IS NULL',
      [id]
    );
    await conn.query(
      'INSERT INTO UserRoleHistory (UserID, Role, StartedAt, ChangedByUserID) VALUES (?, ?, NOW(), ?)',
      [id, nextRole, changedByUserId || null]
    );
  }

  static async getClaims(id) {
    const [rows] = await pool.query('SELECT * FROM UserClaims WHERE UserID = ? ORDER BY UserClaimID DESC', [id]);
    return rows;
  }

  static async addClaim(id, { claim_type, claim_value, ClaimType, ClaimValue }) {
    const [result] = await pool.query(
      'INSERT INTO UserClaims (UserID, ClaimType, ClaimValue) VALUES (?, ?, ?)',
      [id, claim_type ?? ClaimType, claim_value ?? ClaimValue]
    );
    const [rows] = await pool.query('SELECT * FROM UserClaims WHERE UserClaimID = ?', [result.insertId]);
    return rows[0];
  }

  static async deleteClaim(id, claimId) {
    const [result] = await pool.query('DELETE FROM UserClaims WHERE UserID = ? AND UserClaimID = ?', [id, claimId]);
    return result.affectedRows;
  }

  static async getTokens(id) {
    const [rows] = await pool.query('SELECT UserTokenID, UserID, LoginProvider, Name, ExpiresAt, created_at FROM UserTokens WHERE UserID = ? ORDER BY UserTokenID DESC', [id]);
    return rows;
  }

  static async upsertToken(id, { login_provider, LoginProvider, name, Name, value, Value, expires_at, ExpiresAt }) {
    const provider = login_provider ?? LoginProvider;
    const tokenName = name ?? Name;
    const tokenValue = value ?? Value;
    const expiry = expires_at ?? ExpiresAt ?? null;
    await pool.query(
      `INSERT INTO UserTokens (UserID, LoginProvider, Name, Value, ExpiresAt)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE Value = VALUES(Value), ExpiresAt = VALUES(ExpiresAt)`,
      [id, provider, tokenName, tokenValue, expiry]
    );
    const [rows] = await pool.query('SELECT UserTokenID, UserID, LoginProvider, Name, ExpiresAt, created_at FROM UserTokens WHERE UserID = ? AND LoginProvider = ? AND Name = ?', [id, provider, tokenName]);
    return rows[0];
  }

  static async deleteToken(id, tokenId) {
    const [result] = await pool.query('DELETE FROM UserTokens WHERE UserID = ? AND UserTokenID = ?', [id, tokenId]);
    return result.affectedRows;
  }

}

module.exports = User;
module.exports.USER_STATUSES = USER_STATUSES;
