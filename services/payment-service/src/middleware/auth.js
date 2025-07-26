const jwt = require('jsonwebtoken');
const axios = require('axios');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        try {
            const response = await axios.get(
                `${process.env.USER_SERVICE_URL || 'http://localhost:3001'}/users/${decoded.userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                }
            );

            req.user = response.data;
            req.userId = decoded.userId;
            next();
        } catch (error) {
            console.error('User service authentication error:', error.message);
            return res.status(401).json({ error: 'Invalid token or user not found' });
        }

    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = authMiddleware;