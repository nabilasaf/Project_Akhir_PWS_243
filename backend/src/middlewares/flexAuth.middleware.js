const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Flexible Authentication Middleware
 * Supports BOTH JWT Token and API Key authentication
 * Priority: API Key > JWT Token
 */
module.exports = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const authHeader = req.headers['authorization'];

        // 1. Try API Key first
        if (apiKey) {
            const [rows] = await db.query(
                `
        SELECT u.user_id, u.name, u.email, u.role
        FROM api_keys k
        JOIN users u ON k.user_id = u.user_id
        WHERE k.key_string = ? AND k.status = 'active'
        `,
                [apiKey]
            );

            if (rows.length === 0) {
                return res.status(403).json({ message: 'Invalid or inactive API Key' });
            }

            req.user = rows[0];
            req.authMethod = 'api_key';
            return next();
        }

        // 2. Try JWT Token
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
                req.authMethod = 'jwt';
                return next();
            } catch (err) {
                return res.status(401).json({ message: 'Invalid or expired JWT token' });
            }
        }

        // 3. No authentication provided
        return res.status(401).json({
            message: 'Authentication required. Provide either x-api-key or Authorization header.'
        });

    } catch (err) {
        console.error('FLEX AUTH MIDDLEWARE ERROR:', err.message);
        res.status(500).json({ message: 'Server error during authentication' });
    }
};
