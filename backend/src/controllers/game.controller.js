const db = require('../config/db');

/**
 * GET /api/games
 * List + Search
 */
exports.getAll = async (req, res) => {
  try {
    const search = req.query.search || '';

    const [games] = await db.query(
      `
      SELECT 
        game_id as id,
        title,
        genre,
        platform,
        rating,
        api_endpoint,
        status
      FROM games
      WHERE title LIKE ? OR genre LIKE ?
      ORDER BY title ASC
      `,
      [`%${search}%`, `%${search}%`]
    );

    // Map database results to frontend format
    const formattedGames = games.map(game => ({
      id: game.id,
      title: game.title,
      genre: game.genre,
      platform: game.platform,
      rating: parseFloat(game.rating) || 0,
      icon: getGameIcon(game.genre), // Generate icon based on genre
      description: `${game.title} - ${game.genre} game available on ${game.platform}`,
      apiAvailable: game.status === 'available',
      apiEndpoint: game.api_endpoint
    }));

    res.json(formattedGames);
  } catch (err) {
    console.error('GET GAMES ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get icon based on genre
function getGameIcon(genre) {
  const iconMap = {
    'Action': '⚔️',
    'RPG': '🐉',
    'Strategy': '🏰',
    'Sports': '🏎️',
    'Adventure': '🚀',
    'Racing': '🏁',
    'Puzzle': '🧩',
    'Simulation': '🎮'
  };
  return iconMap[genre] || '🎮';
}

exports.getById = async (req, res) => {
  try {
    const gameId = req.params.id;

    const [[game]] = await db.query(
      `
      SELECT 
        game_id as id,
        title,
        genre,
        platform,
        rating,
        api_endpoint,
        status
      FROM games
      WHERE game_id = ?
      `,
      [gameId]
    );

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Format game details for frontend
    const formattedGame = {
      id: game.id,
      title: game.title,
      genre: game.genre,
      platform: game.platform,
      rating: parseFloat(game.rating) || 0,
      icon: getGameIcon(game.genre),
      description: `${game.title} - ${game.genre} game available on ${game.platform}`,
      apiAvailable: game.status === 'available',
      apiEndpoint: game.api_endpoint
    };

    res.json(formattedGame);
  } catch (err) {
    console.error('GET GAME DETAIL ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/games
 * Create new game
 */
exports.create = async (req, res) => {
  try {
    const { title, genre, platform, rating, api_endpoint, status } = req.body;

    // Validation
    if (!title || !genre || !platform) {
      return res.status(400).json({ message: 'Title, genre, and platform are required' });
    }

    const [result] = await db.query(
      `INSERT INTO games (title, genre, platform, rating, api_endpoint, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, genre, platform, rating || 0, api_endpoint || null, status || 'available']
    );

    res.status(201).json({
      message: 'Game created successfully',
      gameId: result.insertId
    });
  } catch (err) {
    console.error('CREATE GAME ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/games/:id
 * Update existing game
 */
exports.update = async (req, res) => {
  try {
    const gameId = req.params.id;
    const { title, genre, platform, rating, api_endpoint, status } = req.body;

    // Check if game exists
    const [[game]] = await db.query('SELECT game_id FROM games WHERE game_id = ?', [gameId]);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Update game
    await db.query(
      `UPDATE games 
       SET title = ?, genre = ?, platform = ?, rating = ?, api_endpoint = ?, status = ?
       WHERE game_id = ?`,
      [title, genre, platform, rating, api_endpoint, status, gameId]
    );

    res.json({ message: 'Game updated successfully' });
  } catch (err) {
    console.error('UPDATE GAME ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/games/:id
 * Delete game from database
 */
exports.delete = async (req, res) => {
  try {
    const gameId = req.params.id;

    // Check if game exists
    const [[game]] = await db.query('SELECT game_id FROM games WHERE game_id = ?', [gameId]);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Delete game
    await db.query('DELETE FROM games WHERE game_id = ?', [gameId]);

    res.json({ message: 'Game deleted successfully' });
  } catch (err) {
    console.error('DELETE GAME ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

