const User = require('../models/user.model');
const pool = require('../config/db');
const { getUserId, isStaff } = require('../middlewares/auth');

function sanitizeUser(user) {
  if (!user) return user;
  const { Password, ...safe } = user;
  return safe;
}

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
    const userId = Number(req.params.id);
    const callerId = Number(getUserId(req));

    if (!isStaff(req) && userId !== callerId) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { full_name, Name, email, Email, password, role, Role } = req.body;
    const name = full_name || Name;
    const userEmail = (email || Email || '').trim().toLowerCase();
    const userRole = role || Role || 'Student';

    if (!name || !userEmail || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findByEmail(userEmail);
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await User.create({
      full_name: name,
      email: userEmail,
      password: hashedPassword,
      role: userRole,
    });

    const UserAccount = require('../models/user-account');
    await UserAccount.create(userId);

    const user = await User.findById(userId);
    res.status(201).json(sanitizeUser(user));
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
    const callerId = Number(getUserId(req));

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!isStaff(req) && userId !== callerId) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    if (!isStaff(req) && updatedInfo.Role != null) {
      return res.status(403).json({ message: 'Cannot change role on your own account' });
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
