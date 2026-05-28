const db = require('../config/db');
const { buildUpdate, findAll, findById, removeById } = require('./generic-crud.model');

const TABLE = 'Roles';
const ID = 'RoleID';

function normalizeName(name) {
  return String(name || '').trim();
}

function normalizeRoleName(name) {
  return normalizeName(name).toUpperCase();
}

exports.getAll = () => findAll(TABLE);
exports.getById = (id) => findById(TABLE, ID, id);

exports.create = async (body) => {
  const name = normalizeName(body.Name || body.name);
  const description = body.Description || body.description || null;
  const normalizedName = normalizeRoleName(body.NormalizedName || body.normalizedName || name);

  if (!name) {
    throw new Error('Role name is required');
  }

  const [result] = await db.query(
    'INSERT INTO Roles (Name, Description, NormalizedName) VALUES (?, ?, ?)',
    [name, description, normalizedName],
  );
  return exports.getById(result.insertId);
};

exports.update = async (id, body) => {
  const name = body.Name ?? body.name;
  const normalizedName = body.NormalizedName ?? body.normalizedName;
  const { set, values } = buildUpdate({
    Name: name === undefined ? undefined : normalizeName(name),
    Description: body.Description ?? body.description,
    NormalizedName: normalizedName === undefined
      ? name === undefined ? undefined : normalizeRoleName(name)
      : normalizeRoleName(normalizedName),
  });

  if (!set.length) return 0;

  values.push(id);
  const [result] = await db.query(`UPDATE Roles SET ${set.join(', ')} WHERE ${ID} = ?`, values);
  return result.affectedRows;
};

exports.delete = (id) => removeById(TABLE, ID, id);
