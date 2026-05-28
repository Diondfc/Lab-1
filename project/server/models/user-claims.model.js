const db = require('../config/db');
const { buildUpdate, findById, removeById } = require('./generic-crud.model');

const TABLE = 'UserClaims';
const ID = 'UserClaimID';

exports.getAll = async () => {
  const [rows] = await db.query(`
    SELECT c.*, u.Name AS UserName, u.Email AS UserEmail
    FROM UserClaims c
    JOIN Users u ON u.UserID = c.UserID
    ORDER BY c.created_at DESC, c.UserClaimID DESC
  `);
  return rows;
};

exports.getById = (id) => findById(TABLE, ID, id);

exports.create = async (body) => {
  const userId = body.UserID || body.userId;
  const claimType = body.ClaimType || body.claimType;
  const claimValue = body.ClaimValue || body.claimValue;

  if (!userId || !claimType || !claimValue) {
    throw new Error('UserID, ClaimType and ClaimValue are required');
  }

  const [result] = await db.query(
    'INSERT INTO UserClaims (UserID, ClaimType, ClaimValue) VALUES (?, ?, ?)',
    [userId, claimType, claimValue],
  );
  return exports.getById(result.insertId);
};

exports.update = async (id, body) => {
  const { set, values } = buildUpdate({
    UserID: body.UserID ?? body.userId,
    ClaimType: body.ClaimType ?? body.claimType,
    ClaimValue: body.ClaimValue ?? body.claimValue,
  });

  if (!set.length) return 0;

  values.push(id);
  const [result] = await db.query(`UPDATE UserClaims SET ${set.join(', ')} WHERE ${ID} = ?`, values);
  return result.affectedRows;
};

exports.delete = (id) => removeById(TABLE, ID, id);
