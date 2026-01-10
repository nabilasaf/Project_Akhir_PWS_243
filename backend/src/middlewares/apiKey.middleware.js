const db = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ message: 'API Key missing' });
    }

    const [rows] = await db.query(
      `
      SELECT u.user_id
      FROM api_keys k
      JOIN users u ON k.user_id = u.user_id
      WHERE k.key_string = ? AND k.status = 'active'
      `,
      [apiKey]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Invalid API Key' });
    }

    req.user = { user_id: rows[0].user_id };
    next();
  } catch (err) {
    console.error('API KEY MIDDLEWARE ERROR:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
