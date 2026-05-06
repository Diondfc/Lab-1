const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify access token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log('Decoded token:', decoded);
        req.user = decoded;
        next();
    } catch (err) {
        // If token expired, check for refresh token
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role || req.user?.user?.role;

        if (!userRole) {
            console.error('Role missing in:', req.user);
            return res.status(403).json({ message: 'No role assigned' });
        }

        if (!roles.includes(userRole)) {
            console.error(`Role ${userRole} not in required roles:`, roles);
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        console.log(`Access granted to ${userRole}`);
        next();
    };
};

module.exports = { auth, authorizeRoles };