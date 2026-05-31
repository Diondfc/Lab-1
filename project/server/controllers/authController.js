const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const UserAccount = require('../models/user-account');
const RefreshToken = require('../models/refresh-token.model');
const { ROLES, normalizeRole } = require('../lib/roles');

function getTokenExpiryDate(expiresInValue) {
  const nowMs = Date.now();
  if (typeof expiresInValue === 'number') {
    return new Date(nowMs + (expiresInValue * 1000));
  }

  const match = String(expiresInValue).match(/^(\d+)([smhd])$/i);
  if (!match) {
    return new Date(nowMs + (30 * 24 * 60 * 60 * 1000));
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(nowMs + (amount * multipliers[unit]));
}

async function register(req, res) {
  try {
    const { full_name, Name, first_name, FirstName, last_name, LastName, phone_number, PhoneNumber, email, Email, password } = req.body;
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
      first_name: first_name ?? FirstName ?? null,
      last_name: last_name ?? LastName ?? null,
      phone_number: phone_number ?? PhoneNumber ?? null,
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

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'This account is deactivated. Contact an administrator.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const role = normalizeRole(user.role);

    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    if (!process.env.JWT_REFRESH_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT_REFRESH_SECRET not set' });
    }

    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: refreshExpiresIn }
    );

    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: getTokenExpiryDate(refreshExpiresIn),
    });

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        first_name: user.first_name,
        last_name: user.last_name,
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
    const storedToken = await RefreshToken.findValidToken(refreshToken);
    if (!storedToken || Number(storedToken.UserID) !== Number(decoded.id)) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const role = normalizeRole(decoded.role || ROLES.USER_MEMBER);

    const token = jwt.sign(
      { id: decoded.id, email: decoded.email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    const newRefreshToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: refreshExpiresIn }
    );

    const newTokenId = await RefreshToken.create({
      userId: decoded.id,
      token: newRefreshToken,
      expiresAt: getTokenExpiryDate(refreshExpiresIn),
    });

    await RefreshToken.revokeTokenById(storedToken.RefreshTokenID, newTokenId);

    return res.json({ token, refreshToken: newRefreshToken });
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
