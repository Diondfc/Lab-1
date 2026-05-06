const db = require('../config/db');


class UserAccount {

    static async create(userId) {
        const [result] = await db.query(
            'INSERT INTO useraccount (UserID) VALUES (?)',
            [userId]
        );
        return result;
    }

    static async MyUserAccountInformation(userId) {
        const [rows] = await db.query(
            `SELECT ua.*, u.*
       FROM ubtlibrarygateway.useraccount ua
       JOIN ubtlibrarygateway.users u ON ua.UserID = u.UserId
       WHERE ua.UserID = ?`,
            [userId]
        );
        return rows[0];

    }
}

module.exports = UserAccount;
