const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

async function register(req, res) {
  try {
    const { full_name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password & Save
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.create({ full_name, email, password: hashedPassword });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short-lived access token
    );

    res.json({ message: 'Login successful', token, user: { id: user.id, full_name: user.full_name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

exports.register = register;
exports.login = login;
const pool = require('../config/db');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    console.log(users)
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  const updatedInfo = req.body;

  try {
    // Basic validation
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await User.updateUserById(userId, updatedInfo);
    return res.json({
      message: "Profile updated successfully",
      affectedRows: result.affectedRows
    });
  } catch (err) {
    console.error("Update error:", err.message);
    return res.status(400).json({
      message: err.message || "Error updating profile",
      error: err.message // More specific error
    });
  }
}

exports.deleteUserById = async (req, res) => {
  const userId = Number(req.params.id)
  const userExists = await User.findById(userId)
  if (!userExists) {
    return res.status(404).json({ message: "No user found" })
  }
  await User.deleteById(userId)
  return res.json({ message: "User got deleted sucessfully" })
}

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

exports.getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    console.log('Searching for user with email:', email);

    const [rows] = await pool.execute(
      'SELECT UserID, Name, Email FROM Users WHERE LOWER(Email) = LOWER(?)',
      [email]
    );

    if (rows.length === 0) {
      console.log('User not found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Found user:', rows[0]);
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