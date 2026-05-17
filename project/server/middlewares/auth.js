const jwt = require('jsonwebtoken');

function getUserId(req) {
  return req.user?.id ?? req.user?.user?.id;
}

function getUserRole(req) {
  return req.user?.role || req.user?.user?.role;
}

function isStaffRole(role) {
  return role === 'Admin' || role === 'Librarian';
}

function isStaff(req) {
  return isStaffRole(getUserRole(req));
}

const auth = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET not set' });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = getUserRole(req);

    if (!userRole) {
      return res.status(403).json({ message: 'No role assigned' });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

/** Allow access when :param matches the authenticated user, or caller is staff. */
const authorizeSelfOrStaff = (paramName = 'userId') => {
  return (req, res, next) => {
    const callerId = Number(getUserId(req));
    const requestedId = Number(req.params[paramName]);

    if (!callerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (isStaff(req) || requestedId === callerId) {
      return next();
    }

    return res.status(403).json({ message: 'Insufficient permissions' });
  };
};

const authorizeStaff = authorizeRoles('Admin', 'Librarian');

module.exports = {
  auth,
  authorizeRoles,
  authorizeStaff,
  authorizeSelfOrStaff,
  getUserId,
  getUserRole,
  isStaff,
  isStaffRole,
};
