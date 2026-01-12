const db = require("../config/db");
const crypto = require("crypto");

/* =====================================================
   DASHBOARD
===================================================== */
exports.dashboard = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [[requests]] = await db.query(
      "SELECT COUNT(*) AS total FROM api_logs WHERE user_id = ?",
      [userId]
    );

    const [[keys]] = await db.query(
      "SELECT COUNT(*) AS total FROM api_keys WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    const [[quota]] = await db.query(
      "SELECT monthly_limit, current_usage FROM user_quotas WHERE user_id = ?",
      [userId]
    );

    res.json({
      total_requests: requests.total,
      active_api_keys: keys.total,
      remaining_quota: quota.monthly_limit - quota.current_usage,
      api_status: "Operational"
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   LOGS
===================================================== */
exports.logs = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [logs] = await db.query(
      `
      SELECT 
        timestamp,
        endpoint,
        method,
        status_code,
        response_time_ms
      FROM api_logs
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
      `,
      [userId, limit, offset]
    );

    const [[count]] = await db.query(
      "SELECT COUNT(*) AS total FROM api_logs WHERE user_id = ?",
      [userId]
    );

    // Transform snake_case to camelCase for frontend
    const transformedLogs = logs.map(log => ({
      timestamp: log.timestamp,
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.status_code,
      responseTime: log.response_time_ms
    }));

    res.json({
      page,
      limit,
      total: count.total,
      data: transformedLogs
    });

  } catch (err) {
    console.error("LOGS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   API KEYS
===================================================== */
exports.getApiKeys = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [keys] = await db.query(
      `
      SELECT 
        id,
        key_string,
        status,
        created_at,
        last_used,
        (SELECT COUNT(*) FROM api_logs WHERE user_id = api_keys.user_id) AS request_count
      FROM api_keys
      WHERE user_id = ?
      ORDER BY id DESC
      `,
      [userId]
    );

    // Map database fields to frontend expected format
    const apiKeys = keys.map(key => ({
      id: key.id,
      api_key: key.key_string,
      is_active: key.status === 'active',
      created_at: key.created_at,
      last_used: key.last_used,
      request_count: key.request_count
    }));

    res.json({ apiKeys });

  } catch (err) {
    console.error("GET API KEYS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.generateApiKey = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const apiKey = "gv_live_" + crypto.randomBytes(24).toString("hex");

    const [result] = await db.query(
      "INSERT INTO api_keys (user_id, key_string, status) VALUES (?, ?, 'active')",
      [userId, apiKey]
    );

    res.status(201).json({
      message: "API key generated successfully",
      apiKey: apiKey,
      key_id: result.insertId
    });

  } catch (err) {
    console.error("GENERATE KEY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.revokeApiKey = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const keyId = req.params.keyId;

    const [[key]] = await db.query(
      "SELECT id FROM api_keys WHERE id = ? AND user_id = ?",
      [keyId, userId]
    );

    if (!key) {
      return res.status(404).json({ message: "API key not found" });
    }

    await db.query("DELETE FROM api_keys WHERE id = ?", [keyId]);

    res.json({ message: "API key revoked successfully" });

  } catch (err) {
    console.error("REVOKE KEY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateApiKeyStatus = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const keyId = req.params.keyId;
    const { status } = req.body;

    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [[key]] = await db.query(
      "SELECT id FROM api_keys WHERE id = ? AND user_id = ?",
      [keyId, userId]
    );

    if (!key) {
      return res.status(404).json({ message: "API key not found" });
    }

    await db.query(
      "UPDATE api_keys SET status = ? WHERE id = ?",
      [status, keyId]
    );

    res.json({
      message: `API key ${status === "active" ? "enabled" : "disabled"} successfully`
    });

  } catch (err) {
    console.error("UPDATE KEY STATUS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.regenerateApiKey = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const keyId = req.params.keyId;
    const newApiKey = "gv_live_" + crypto.randomBytes(24).toString("hex");

    const [[key]] = await db.query(
      "SELECT id FROM api_keys WHERE id = ? AND user_id = ?",
      [keyId, userId]
    );

    if (!key) {
      return res.status(404).json({ message: "API key not found" });
    }

    await db.query(
      "UPDATE api_keys SET key_string = ? WHERE id = ?",
      [newApiKey, keyId]
    );

    res.json({
      message: "API key regenerated successfully",
      key_string: newApiKey
    });

  } catch (err) {
    console.error("REGENERATE KEY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   USAGE
===================================================== */
exports.usage = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get filter parameters
    const filterDate = req.query.date;
    const filterStatus = req.query.status;

    const [chartData] = await db.query(
      `
      SELECT 
        DATE(timestamp) AS date,
        COUNT(*) AS count
      FROM api_logs
      WHERE user_id = ?
        AND timestamp >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
      `,
      [userId]
    );

    // Get all unique status codes for this user (for dropdown)
    const [uniqueStatuses] = await db.query(
      `
      SELECT DISTINCT status_code
      FROM api_logs
      WHERE user_id = ?
      ORDER BY status_code ASC
      `,
      [userId]
    );

    // Build dynamic WHERE clause for filtering
    let whereConditions = ['user_id = ?'];
    let queryParams = [userId];

    if (filterDate) {
      whereConditions.push('DATE(timestamp) = ?');
      queryParams.push(filterDate);
    }

    if (filterStatus) {
      whereConditions.push('status_code = ?');
      queryParams.push(filterStatus);
    }

    const whereClause = whereConditions.join(' AND ');

    const [recentRequests] = await db.query(
      `
      SELECT 
        timestamp,
        endpoint,
        method,
        status_code,
        response_time_ms
      FROM api_logs
      WHERE ${whereClause}
      ORDER BY timestamp DESC
      LIMIT 50
      `,
      queryParams
    );

    // Transform snake_case to camelCase for frontend
    const transformedRequests = recentRequests.map(req => ({
      timestamp: req.timestamp,
      endpoint: req.endpoint,
      method: req.method,
      statusCode: req.status_code,
      responseTime: req.response_time_ms
    }));

    // Extract status codes from unique statuses query
    const availableStatusCodes = uniqueStatuses.map(s => s.status_code);

    res.json({
      chartData,
      recentRequests: transformedRequests,
      availableStatusCodes // ✅ Send all unique status codes
    });

  } catch (err) {
    console.error("USAGE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   API EXPLORE (FINAL — SATU SAJA)
===================================================== */
exports.getApiExplore = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        title,
        api_endpoint,
        genre,
        platform
      FROM games
      WHERE api_endpoint IS NOT NULL
    `);

    res.json(rows);

  } catch (err) {
    console.error("API EXPLORE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
