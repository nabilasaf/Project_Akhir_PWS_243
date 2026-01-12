const db = require('../config/db');

/* ================================
   DASHBOARD STATS
================================ */
exports.getDashboardStats = async (req, res) => {

  try {
    const [[users]] = await db.query('SELECT COUNT(*) total FROM users');
    const [[keys]] = await db.query('SELECT COUNT(*) total FROM api_keys WHERE status="active"');
    const [[logs]] = await db.query('SELECT COUNT(*) total FROM api_logs');
    const [[games]] = await db.query('SELECT COUNT(*) total FROM games');

    // Get usage data for chart (last 7 days)
    const [usageData] = await db.query(`
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m-%d') as date,
        COUNT(*) as count
      FROM api_logs
      WHERE timestamp >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY date
      ORDER BY date ASC
    `);

    // Get user growth data for chart (last 4 weeks)
    console.log('Fetching dashboard stats...'); // Debug log to verify code update
    const [userData] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, 'Week %u') as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
      GROUP BY date
      ORDER BY date ASC
    `);

    res.json({
      totalUsers: users.total,
      activeApiKeys: keys.total,
      todayRequests: logs.total,
      totalGames: games.total,
      usageData,
      userData
    });
  } catch (err) {
    console.error('DASHBOARD STATS ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ================================
   USERS
================================ */
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.user_id,
        u.email,
        u.role,
        COALESCE(u.status,'active') as status,
        u.created_at,
        COUNT(DISTINCT CASE WHEN k.status = 'active' THEN k.id END) as api_keys,
        COUNT(DISTINCT l.id) as total_requests
      FROM users u
      LEFT JOIN api_keys k ON u.user_id = k.user_id
      LEFT JOIN api_logs l ON u.user_id = l.user_id
      GROUP BY u.user_id, u.email, u.role, u.status, u.created_at
      ORDER BY u.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('GET ALL USERS ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  await db.query(
    'UPDATE users SET status = ? WHERE user_id = ?',
    [status, userId]
  );

  res.json({ message: 'User updated', status });
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, role, status } = req.body;

    if (!email || !role || !status) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    await db.query(
      `UPDATE users 
       SET email = ?, role = ?, status = ?
       WHERE user_id = ?`,
      [email, role, status, userId]
    );

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ================================
   GAMES (ADMIN)
================================ */
exports.getAllGames = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        game_id as id,
        title, 
        genre, 
        platform,
        rating,
        api_endpoint,
        status
      FROM games
      ORDER BY title ASC
    `);

    // Map to frontend format
    const formattedGames = rows.map(game => ({
      id: game.id,
      title: game.title,
      genre: game.genre,
      platform: game.platform,
      rating: parseFloat(game.rating) || 0,
      api_endpoint: game.api_endpoint,
      status: game.status,
      apiAvailable: game.status === 'available'
    }));

    res.json(formattedGames);
  } catch (err) {
    console.error("Error fetching games:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


/* ================================
   API KEYS
================================ */
exports.getAllApiKeys = async (req, res) => {
  const [rows] = await db.query(`
    SELECT key_string, status, created_at, last_used_at
    FROM api_keys
  `);

  res.json(rows);
};

/* ================================
   API LOGS
================================ */
exports.getApiLogs = async (req, res) => {
  const [logs] = await db.query(`
    SELECT 
      l.timestamp,
      u.email,
      l.endpoint,
      l.method,
      l.status_code,
      l.response_time_ms
    FROM api_logs l
    LEFT JOIN users u ON l.user_id = u.user_id
    ORDER BY l.timestamp DESC
    LIMIT 50
  `);

  res.json(logs);
};

/* ================================
   API MONITORING
================================ */
exports.getMonitoringStats = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_requests,
        ROUND(AVG(response_time_ms), 0) as avg_response_time,
        SUM(CASE WHEN status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
        ROUND((SUM(CASE WHEN status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as success_rate,
        ROUND((SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as error_rate
      FROM api_logs
    `);

    // Get requests in last minute
    const [[reqPerMin]] = await db.query(`
      SELECT COUNT(*) as count
      FROM api_logs
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
    `);

    res.json({
      requestsPerMin: reqPerMin.count,
      avgResponseTime: stats[0].avg_response_time || 0,
      successRate: stats[0].success_rate || 0,
      errorRate: stats[0].error_rate || 0,
      totalRequests: stats[0].total_requests
    });
  } catch (err) {
    console.error('MONITORING STATS ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStatusDistribution = async (req, res) => {
  try {
    const [distribution] = await db.query(`
      SELECT 
        CASE 
          WHEN status_code BETWEEN 200 AND 299 THEN '200 OK'
          WHEN status_code BETWEEN 300 AND 399 THEN '300 Redirect'
          WHEN status_code = 404 THEN '404 Not Found'
          WHEN status_code BETWEEN 400 AND 499 THEN '4xx Client Error'
          WHEN status_code BETWEEN 500 AND 599 THEN '500 Server Error'
          ELSE 'Other'
        END as category,
        COUNT(*) as count,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM api_logs)) * 100, 1) as percentage
      FROM api_logs
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json(distribution);
  } catch (err) {
    console.error('STATUS DISTRIBUTION ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTopEndpoints = async (req, res) => {
  try {
    const [endpoints] = await db.query(`
      SELECT 
        method,
        endpoint,
        COUNT(*) as count
      FROM api_logs
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY method, endpoint
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json(endpoints);
  } catch (err) {
    console.error('TOP ENDPOINTS ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRequestVolume = async (req, res) => {
  try {
    const [volume] = await db.query(`
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour,
        COUNT(*) as count
      FROM api_logs
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
      ORDER BY hour
    `);

    res.json(volume);
  } catch (err) {
    console.error('REQUEST VOLUME ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getResponseTimeTrend = async (req, res) => {
  try {
    const [trend] = await db.query(`
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour,
        ROUND(AVG(response_time_ms), 0) as avg_response_time
      FROM api_logs
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
      ORDER BY hour
    `);

    res.json(trend);
  } catch (err) {
    console.error('RESPONSE TIME TREND ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ================================
   SYSTEM LOGS
================================ */
exports.getSystemLogsStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT 
        COUNT(*) as total_logs,
        SUM(CASE WHEN status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
        SUM(CASE WHEN status_code BETWEEN 300 AND 399 THEN 1 ELSE 0 END) as warning_count
      FROM api_logs
    `);

    res.json(stats);
  } catch (err) {
    console.error('SYSTEM LOGS STATS ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
