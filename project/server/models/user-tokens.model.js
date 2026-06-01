const db = require('../config/db');
const { buildUpdate, findById, removeById } = require('./generic-crud.model');

const TABLE = 'UserTokens';
const ID = 'UserTokenID';

exports.getAll = async () => {
  const [rows] = await db.query(`
    SELECT t.UserTokenID, t.UserID, u.Name AS UserName, u.Email AS UserEmail,
           t.LoginProvider, t.TokenName, t.ExpiresAt, t.created_at
    FROM UserTokens t
    JOIN Users u ON u.UserID = t.UserID
    ORDER BY t.created_at DESC, t.UserTokenID DESC
  `);
  return rows;
};

exports.getById = async (id) => {
  const token = await findById(TABLE, ID, id);
  if (!token) return null;
  return { ...token, TokenValue: undefined };
};

exports.create = async (body) => {
  const userId = body.UserID || body.userId;
  const loginProvider = body.LoginProvider || body.loginProvider;
  const tokenName = body.TokenName || body.tokenName;
  const tokenValue = body.TokenValue || body.tokenValue;
  const expiresAt = body.ExpiresAt ?? body.expiresAt ?? null;

  if (!userId || !loginProvider || !tokenName || !tokenValue) {
    throw new Error('UserID, LoginProvider, TokenName and TokenValue are required');
  }

  const [result] = await db.query(
    `INSERT INTO UserTokens (UserID, LoginProvider, TokenName, TokenValue, ExpiresAt)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE TokenValue = VALUES(TokenValue), ExpiresAt = VALUES(ExpiresAt)`,
    [userId, loginProvider, tokenName, tokenValue, expiresAt],
  );

  if (result.insertId) {
    return exports.getById(result.insertId);
  }

  const [rows] = await db.query(
    `SELECT UserTokenID
     FROM UserTokens
     WHERE UserID = ? AND LoginProvider = ? AND TokenName = ?
     LIMIT 1`,
    [userId, loginProvider, tokenName],
  );
  return exports.getById(rows[0]?.UserTokenID);
};

exports.update = async (id, body) => {
  const { set, values } = buildUpdate({
    UserID: body.UserID ?? body.userId,
    LoginProvider: body.LoginProvider ?? body.loginProvider,
    TokenName: body.TokenName ?? body.tokenName,
    TokenValue: body.TokenValue ?? body.tokenValue,
    ExpiresAt: body.ExpiresAt ?? body.expiresAt,
  });

  if (!set.length) return 0;

  values.push(id);
  const [result] = await db.query(`UPDATE UserTokens SET ${set.join(', ')} WHERE ${ID} = ?`, values);
  return result.affectedRows;
};

exports.delete = (id) => removeById(TABLE, ID, id);
