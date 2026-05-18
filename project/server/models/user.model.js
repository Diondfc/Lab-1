const pool = require('../config/db');

class User {
    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        return rows[0];
    }

    static async create(userData) {
        const { full_name, email, password } = userData;
        const [result] = await pool.query(
            'INSERT INTO Users (full_name, email, password) VALUES (?, ?, ?)',
            [full_name, email, password]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM Users WHERE id = ?', [id]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await pool.query('SELECT id, full_name, email FROM Users');
        return rows;
    }

    static async deleteById(id) {
        await pool.query('DELETE FROM Users WHERE id = ?', [id]);
    }

    static async updateUserById(id, userData) {
        const { full_name, email } = userData;
        const [result] = await pool.query(
            'UPDATE Users SET full_name = ?, email = ? WHERE id = ?',
            [full_name, email, id]
        );
        return result;
    }
}

module.exports = User;
