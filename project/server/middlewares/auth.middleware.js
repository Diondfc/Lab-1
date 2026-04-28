const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // 1. Get the token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format is "Bearer <token>"

    // 2. If no token, deny access
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // 3. Verify the token using our secret key
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }

        // 4. Attach the user info to the request and move to the controller!
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;
