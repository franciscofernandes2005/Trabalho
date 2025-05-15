const jwt = require('jsonwebtoken');

// Secret key for JWT - in production, this should be in environment variables
const JWT_SECRET = 'grupo-7';

const authMiddleware = (req, res, next) => {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    // The token should be in the format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Invalid token format' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Add user information to the request object
        req.user = decoded;
        
        // Continue to the next middleware or route handler
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware; 