const db = require("../config/db");
const crypto = require("crypto");

/**
 * GET USER API KEYS
 */
exports.getKeys = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [rows] = await db.query(
      `SELECT id, key_string, status, created_at
       FROM api_keys
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GENERATE API KEY
 */
exports.generateKey = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const key = "gv_live_" + crypto.randomBytes(24).toString("hex");

    await db.query(
      `INSERT INTO api_keys (user_id, key_string, status)
       VALUES (?, ?, 'active')`,
      [userId, key]
    );

    res.status(201).json({ message: "API key created", key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * REVOKE API KEY
 */
exports.revokeKey = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    await db.query(
      `UPDATE api_keys
       SET status = 'revoked'
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    res.json({ message: "API key revoked" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
