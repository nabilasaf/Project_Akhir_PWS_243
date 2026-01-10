const db = require('../config/db');

/**
 * SUMMARY (stat cards)
 */
exports.summary = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [[requests]] = await db.query(
      'SELECT COUNT(*) AS total FROM api_logs WHERE user_id = ?',
      [userId]
    );

    const [[avgResp]] = await db.query(
      'SELECT AVG(response_time_ms) AS avg_response FROM api_logs WHERE user_id = ?',
      [userId]
    );

    const [[success]] = await db.query(
      `SELECT 
         SUM(status_code BETWEEN 200 AND 299) / COUNT(*) * 100 AS success_rate
       FROM api_logs
       WHERE user_id = ?`,
      [userId]
    );

    const [[quota]] = await db.query(
      'SELECT monthly_limit, current_usage FROM user_quotas WHERE user_id = ?',
      [userId]
    );

    res.json({
      total_requests: requests.total,
      avg_response_time: Math.round(avgResp.avg_response || 0),
      success_rate: Number(success.success_rate || 0).toFixed(1),
      quota: {
        used: quota.current_usage,
        limit: quota.monthly_limit
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DAILY TABLE
 */
exports.daily = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [rows] = await db.query(
      `
      SELECT 
        DATE(timestamp) AS date,
        COUNT(*) AS requests,
        ROUND(AVG(response_time_ms)) AS avg_response,
        SUM(status_code BETWEEN 200 AND 299) / COUNT(*) * 100 AS success_rate
      FROM api_logs
      WHERE user_id = ?
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 7
      `,
      [userId]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * TREND (line chart)
 */
exports.trend = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [rows] = await db.query(
      `
      SELECT 
        DATE(timestamp) AS date,
        COUNT(*) AS requests
      FROM api_logs
      WHERE user_id = ?
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
      LIMIT 8
      `,
      [userId]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUsageHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // default: 7 hari
    const days = Number(req.query.days) || 7;

    const [rows] = await db.query(
      `
      SELECT 
        DATE(timestamp) AS date,
        COUNT(*) AS count
      FROM api_logs
      WHERE user_id = ?
        AND timestamp >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp)
      `,
      [userId, days]
    );

    const total = rows.reduce((sum, r) => sum + r.count, 0);

    res.json({
      range: `${days}_days`,
      totalRequests: total,
      daily: rows
    });
  } catch (err) {
    console.error('USAGE HISTORY ERROR:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
