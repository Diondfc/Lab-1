const pool = require('../config/db');

class User {
    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM Users WHERE Email = ?', [email]);
        return rows[0];
    }

    static async create(userData) {
        const { full_name, email, password, role = 'Student' } = userData;
        const [result] = await pool.query(
            'INSERT INTO Users (Name, Email, Password, Role) VALUES (?, ?, ?, ?)',
            [full_name, email, password, role]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM Users WHERE UserID = ?', [id]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await pool.query('SELECT UserID, Name, Email, Role FROM Users');
        return rows;
    }

    static async deleteById(id) {
        await pool.query('DELETE FROM Users WHERE UserID = ?', [id]);
    }

    static async updateUserById(id, userData) {
        const { Name, Email, Role } = userData;
        const [result] = await pool.query(
            'UPDATE Users SET Name = ?, Email = ?, Role = ? WHERE UserID = ?',
            [Name, Email, Role, id]
        );
        return result;
    }
}

module.exports = User;
