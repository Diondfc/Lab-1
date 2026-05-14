const User = require('../models/user.model');
const pool = require('../config/db');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "No user found" });
    }
    await User.deleteById(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const updatedInfo = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await User.updateUserById(userId, updatedInfo);
    res.json({
      message: "Profile updated successfully",
      affectedRows: result.affectedRows
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    
    // Using pool directly as User model findByEmail returns everything (including password)
    // and we want specific fields for the loan form.
    const [rows] = await pool.execute(
      'SELECT UserID, Name, Email FROM Users WHERE LOWER(Email) = LOWER(?)',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};
