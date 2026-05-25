const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const UserAccount = require('../models/user-account');

async function register(req, res) {
  try {
    const { full_name, Name, email, Email, password } = req.body;
    const normalizedEmail = (email || Email || '').trim().toLowerCase();
    const normalizedName = (full_name || Name || '').trim();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check if user exists
    const existingUser = await User.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password & Save
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = await User.create({
      full_name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
    });
    await UserAccount.create(userId);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET not set' });
    }

    // Find user
    const user = await User.findByEmail(email?.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const role = user.role || 'Student';

    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    if (!process.env.JWT_REFRESH_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT_REFRESH_SECRET not set' });
    }

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function refresh(req, res) {
  try {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT secrets not set' });
    }

    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const role = decoded.role || 'Student';

    const token = jwt.sign(
      { id: decoded.id, email: decoded.email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({ token });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired', code: 'REFRESH_TOKEN_EXPIRED' });
    }

    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

exports.register = register;
exports.login = login;
exports.refresh = refresh;
