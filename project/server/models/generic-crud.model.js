const db = require('../config/db');

function buildUpdate(fields = {}) {
  const set = [];
  const values = [];
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      set.push(`${key} = ?`);
      values.push(value);
    }
  });
  return { set, values };
}

async function findAll(table) { const [rows] = await db.query(`SELECT * FROM ${table}`); return rows; }
async function findById(table, idField, id) { const [rows] = await db.query(`SELECT * FROM ${table} WHERE ${idField} = ?`, [id]); return rows[0] || null; }
async function removeById(table, idField, id) { const [r] = await db.query(`DELETE FROM ${table} WHERE ${idField} = ?`, [id]); return r.affectedRows; }

module.exports = { buildUpdate, findAll, findById, removeById };
