const crypto = require('crypto');
const pool = require('../config/db');

class RefreshToken {
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async create({ userId, token, expiresAt }) {
    const tokenHash = RefreshToken.hashToken(token);
    const [result] = await pool.query(
      'INSERT INTO RefreshTokens (UserID, TokenHash, ExpiresAt) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );
    return result.insertId;
  }

  static async findValidToken(token) {
    const tokenHash = RefreshToken.hashToken(token);
    const [rows] = await pool.query(
      `SELECT * FROM RefreshTokens
       WHERE TokenHash = ?
         AND RevokedAt IS NULL
         AND ExpiresAt > UTC_TIMESTAMP()
       LIMIT 1`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  static async revokeTokenById(id, replacedByTokenId = null) {
    await pool.query(
      'UPDATE RefreshTokens SET RevokedAt = UTC_TIMESTAMP(), ReplacedByTokenID = ? WHERE RefreshTokenID = ? AND RevokedAt IS NULL',
      [replacedByTokenId, id]
    );
  }
}

module.exports = RefreshToken;
