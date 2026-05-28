const pool = require('../config/db');
const { normalizeRole, isValidRole } = require('../lib/roles');

function normalizeName(name) {
  return String(name || '').trim();
}

function normalizedName(name) {
  return normalizeName(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

class Role {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM Roles ORDER BY RoleID ASC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM Roles WHERE RoleID = ?', [id]);
    return rows[0] || null;
  }

  static async findByName(name) {
    const roleName = normalizeRole(name);
    const [rows] = await pool.query('SELECT * FROM Roles WHERE Name = ? OR NormalizedName = ?', [roleName, normalizedName(roleName)]);
    return rows[0] || null;
  }

  static async create({ Name, name, Description, description, NormalizedName }) {
    const roleName = normalizeRole(Name || name);
    if (!isValidRole(roleName)) {
      throw new Error('Role must be one of: Admin, Manager, User/Member');
    }
    const [result] = await pool.query(
      'INSERT INTO Roles (Name, Description, NormalizedName) VALUES (?, ?, ?)',
      [roleName, Description ?? description ?? null, NormalizedName || normalizedName(roleName)],
    );
    return Role.findById(result.insertId);
  }

  static async update(id, { Name, name, Description, description, NormalizedName }) {
    const updates = [];
    const values = [];
    if (Name != null || name != null) {
      const roleName = normalizeRole(Name ?? name);
      if (!isValidRole(roleName)) {
        throw new Error('Role must be one of: Admin, Manager, User/Member');
      }
      updates.push('Name = ?');
      values.push(roleName);
      updates.push('NormalizedName = ?');
      values.push(NormalizedName || normalizedName(roleName));
    } else if (NormalizedName != null) {
      updates.push('NormalizedName = ?');
      values.push(NormalizedName);
    }
    if (Description !== undefined || description !== undefined) {
      updates.push('Description = ?');
      values.push(Description ?? description ?? null);
    }
    if (!updates.length) return 0;
    values.push(id);
    const [result] = await pool.query(`UPDATE Roles SET ${updates.join(', ')} WHERE RoleID = ?`, values);
    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM Roles WHERE RoleID = ?', [id]);
    return result.affectedRows;
  }
}

module.exports = Role;
