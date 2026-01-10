const db = require('../config/db');

module.exports = (req, res, next) => {
  const start = Date.now();

  res.on('finish', async () => {
    try {
      if (!req.user) return;

      const responseTime = Date.now() - start;

      await db.query(
        `
        INSERT INTO api_logs
        (user_id, endpoint, method, status_code, response_time_ms)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          req.user.user_id,
          req.originalUrl,
          req.method,
          res.statusCode,
          responseTime
        ]
      );
    } catch (err) {
      console.error('LOGGER ERROR:', err.message);
    }
  });

  next();
};
