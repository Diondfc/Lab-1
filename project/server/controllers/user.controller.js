const User = require('../models/user.model');
const pool = require('../config/db');
const { getUserId, isStaff } = require('../middlewares/auth');
const { normalizeRole } = require('../lib/roles');

function sanitizeUser(user) {
  if (!user) return user;
  const { Password, password, ...safe } = user;
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
    const { full_name, Name, first_name, FirstName, last_name, LastName, phone_number, PhoneNumber, email_confirmed, EmailConfirmed, email, Email, password, role, Role, status, Status } = req.body;
    const name = full_name || Name;
    const userEmail = (email || Email || '').trim().toLowerCase();
    const userRole = normalizeRole(role || Role);

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
      first_name: first_name ?? FirstName ?? null,
      last_name: last_name ?? LastName ?? null,
      phone_number: phone_number ?? PhoneNumber ?? null,
      email_confirmed: email_confirmed ?? EmailConfirmed ?? 0,
      role: userRole,
      status: status || Status,
      changedByUserId: Number(getUserId(req)) || null,
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

    if (!isStaff(req) && (updatedInfo.Role != null || updatedInfo.role != null)) {
      return res.status(403).json({ message: 'Cannot change role on your own account' });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    updatedInfo.changedByUserId = callerId;
    const result = await User.updateUserById(userId, updatedInfo);
    res.json({
      message: "Profile updated successfully",
      affectedRows: result.affectedRows
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const callerId = Number(getUserId(req));

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (userId === callerId) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.setStatus(userId, 'Inactive');
    const user = await User.findById(userId);
    res.json({ message: "User deactivated successfully", user: sanitizeUser(user) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.activateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.setStatus(userId, 'Active');
    const user = await User.findById(userId);
    res.json({ message: "User activated successfully", user: sanitizeUser(user) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserRoles = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const roles = await User.getRoles(userId);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const role = req.body.role || req.body.Role;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const roles = await User.assignRole(userId, role, Number(getUserId(req)) || null);
    const updatedUser = await User.findById(userId);
    res.json({
      message: "Role assigned successfully",
      user: sanitizeUser(updatedUser),
      roles,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.removeRole = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const role = decodeURIComponent(req.params.role || '');
    const callerId = Number(getUserId(req));

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (userId === callerId && role === 'Admin') {
      return res.status(400).json({ message: "You cannot remove your own Admin role" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const roles = await User.removeRole(userId, role, callerId || null);
    const updatedUser = await User.findById(userId);
    res.json({
      message: "Role removed successfully",
      user: sanitizeUser(updatedUser),
      roles,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getRoleHistory = async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const callerId = Number(getUserId(req));

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!isStaff(req) && userId !== callerId) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const history = await User.getRoleHistory(userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

exports.getUserClaims = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const claims = await User.getClaims(userId);
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addUserClaim = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const claim = await User.addClaim(userId, req.body);
    res.status(201).json(claim);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteUserClaim = async (req, res) => {
  try {
    const affected = await User.deleteClaim(Number(req.params.id), Number(req.params.claimId));
    if (!affected) return res.status(404).json({ message: 'Claim not found' });
    res.json({ message: 'Claim deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserTokens = async (req, res) => {
  try {
    const tokens = await User.getTokens(Number(req.params.id));
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.upsertUserToken = async (req, res) => {
  try {
    const token = await User.upsertToken(Number(req.params.id), req.body);
    res.status(201).json(token);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteUserToken = async (req, res) => {
  try {
    const affected = await User.deleteToken(Number(req.params.id), Number(req.params.tokenId));
    if (!affected) return res.status(404).json({ message: 'Token not found' });
    res.json({ message: 'Token deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
