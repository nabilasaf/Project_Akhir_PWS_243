const db = require('../config/db');

/* ================================
   DASHBOARD STATS
================================ */
exports.getDashboardStats = async (req, res) => {
  const [[users]] = await db.query('SELECT COUNT(*) total FROM users');
  const [[keys]] = await db.query('SELECT COUNT(*) total FROM api_keys WHERE status="active"');
  const [[logs]] = await db.query('SELECT COUNT(*) total FROM api_logs');
  const [[games]] = await db.query('SELECT COUNT(*) total FROM games');

  res.json({
    totalUsers: users.total,
    activeApiKeys: keys.total,
    todayRequests: logs.total,
    totalGames: games.total
  });
};


/* ================================
   USERS
================================ */
exports.getAllUsers = async (req, res) => {
  const [rows] = await db.query(`
    SELECT 
      user_id,
      email,
      role,
      COALESCE(status,'active') status,
      created_at
    FROM users
    ORDER BY created_at DESC
  `);

  res.json(rows);
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
    JOIN users u ON l.user_id = u.user_id
    ORDER BY l.timestamp DESC
    LIMIT 50
  `);

  res.json(logs);
};
