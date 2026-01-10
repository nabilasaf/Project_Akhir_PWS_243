const db = require('../config/db');

module.exports = async (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', async () => {
        try {
            // hanya log jika API Key dipakai
            if (!req.apiKey) return;

            const responseTime = Date.now() - startTime;

            // kurangi quota
            await db.query(
                `UPDATE user_quotas
                 SET current_usage = current_usage + 1
                 WHERE user_id = ?`,
                [req.apiKey.user_id]
            );

            // update last_used api key
            await db.query(
                `UPDATE api_keys
                 SET last_used = NOW()
                 WHERE id = ?`,
                [req.apiKey.id]
            );

            // insert api log
            await db.query(
                `INSERT INTO api_logs
                 (user_id, endpoint, method, status_code, response_time_ms)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    req.apiKey.user_id,
                    req.originalUrl,
                    req.method,
                    res.statusCode,
                    responseTime
                ]
            );

        } catch (err) {
            console.error('Logging error:', err.message);
        }
    });

    next();
};
