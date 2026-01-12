const db = require('../config/db');

/**
 * Request Logger Middleware
 * Logs ALL API requests to api_logs table, including failed authentication attempts
 */
module.exports = (req, res, next) => {
    const startTime = Date.now();

    // Store original send function
    const originalSend = res.send;

    // Override send to capture response
    res.send = function (data) {
        const responseTime = Date.now() - startTime;

        // Log request asynchronously (don't block response)
        logRequest(req, res.statusCode, responseTime).catch(err => {
            console.error('Request logging error:', err);
        });

        // Call original send
        return originalSend.call(this, data);
    };

    next();
};

/**
 * Log request to database
 */
async function logRequest(req, statusCode, responseTime) {
    try {
        let userId = null;

        // Try to get user_id from authenticated request
        if (req.user && req.user.user_id) {
            userId = req.user.user_id;
        }
        // If not authenticated, try to get user_id from API key header
        else if (req.headers['x-api-key']) {
            const [rows] = await db.query(
                'SELECT user_id FROM api_keys WHERE key_string = ?',
                [req.headers['x-api-key']]
            );
            if (rows.length > 0) {
                userId = rows[0].user_id;
            }
        }

        // Insert log entry
        // Use originalUrl to get full path including query params
        const endpoint = req.originalUrl || req.path;

        await db.query(
            `INSERT INTO api_logs (user_id, endpoint, method, status_code, response_time_ms, timestamp)
       VALUES (?, ?, ?, ?, ?, NOW())`,
            [userId, endpoint, req.method, statusCode, responseTime]
        );

        // Update quota for successful requests (2xx status codes)
        if (userId && statusCode >= 200 && statusCode < 300) {
            await db.query(
                'UPDATE user_quotas SET current_usage = current_usage + 1 WHERE user_id = ?',
                [userId]
            );
        }
    } catch (err) {
        // Don't throw - logging should never break the API
        console.error('Failed to log request:', err);
    }
}
