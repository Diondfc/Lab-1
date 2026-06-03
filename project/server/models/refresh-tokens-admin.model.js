const crypto = require('crypto');
const db = require('../config/db');
const { buildUpdate, removeById } = require('./generic-crud.model');

const TABLE = 'RefreshTokens';
const ID = 'RefreshTokenID';

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

exports.getAll = async () => {
  const [rows] = await db.query(`
    SELECT rt.RefreshTokenID, rt.UserID, u.Name AS UserName, u.Email AS UserEmail,
           rt.TokenHash, rt.ExpiresAt, rt.RevokedAt, rt.ReplacedByTokenID, rt.created_at
    FROM RefreshTokens rt
    JOIN Users u ON u.UserID = rt.UserID
    ORDER BY rt.created_at DESC, rt.RefreshTokenID DESC
  `);
  return rows;
};

exports.getById = async (id) => {
  const [rows] = await db.query(
    `SELECT rt.RefreshTokenID, rt.UserID, u.Name AS UserName, u.Email AS UserEmail,
            rt.TokenHash, rt.ExpiresAt, rt.RevokedAt, rt.ReplacedByTokenID, rt.created_at
     FROM RefreshTokens rt
     JOIN Users u ON u.UserID = rt.UserID
     WHERE rt.RefreshTokenID = ?`,
    [id],
  );
  return rows[0] || null;
};

exports.create = async (body) => {
  const userId = body.UserID || body.userId;
  const rawToken = body.Token || body.token;
  const tokenHash = body.TokenHash || body.tokenHash || (rawToken ? hashToken(rawToken) : null);
  const expiresAt = body.ExpiresAt || body.expiresAt;

  if (!userId || !tokenHash || !expiresAt) {
    throw new Error('UserID, Token/TokenHash and ExpiresAt are required');
  }

  const [result] = await db.query(
    `INSERT INTO RefreshTokens (UserID, TokenHash, ExpiresAt, RevokedAt, ReplacedByTokenID)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      tokenHash,
      expiresAt,
      body.RevokedAt ?? body.revokedAt ?? null,
      body.ReplacedByTokenID ?? body.replacedByTokenId ?? null,
    ],
  );
  return exports.getById(result.insertId);
};

exports.update = async (id, body) => {
  const rawToken = body.Token || body.token;
  const tokenHash = body.TokenHash ?? body.tokenHash ?? (rawToken ? hashToken(rawToken) : undefined);
  const { set, values } = buildUpdate({
    UserID: body.UserID ?? body.userId,
    TokenHash: tokenHash,
    ExpiresAt: body.ExpiresAt ?? body.expiresAt,
    RevokedAt: body.RevokedAt ?? body.revokedAt,
    ReplacedByTokenID: body.ReplacedByTokenID ?? body.replacedByTokenId,
  });

  if (!set.length) return 0;

  values.push(id);
  const [result] = await db.query(`UPDATE ${TABLE} SET ${set.join(', ')} WHERE ${ID} = ?`, values);
  return result.affectedRows;
};

exports.revoke = async (id) => {
  const [result] = await db.query(
    `UPDATE ${TABLE} SET RevokedAt = UTC_TIMESTAMP() WHERE ${ID} = ? AND RevokedAt IS NULL`,
    [id],
  );
  return result.affectedRows;
};

exports.delete = (id) => removeById(TABLE, ID, id);
