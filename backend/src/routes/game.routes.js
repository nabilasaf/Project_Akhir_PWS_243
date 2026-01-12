const express = require('express');
const router = express.Router();

const gameController = require('../controllers/game.controller');
const requestLogger = require('../middlewares/requestLogger.middleware');

// Apply request logger to ALL routes (logs before auth)
router.use(requestLogger);

// Auth middleware already applied at app level
// GET all games (with search)
router.get('/', gameController.getAll);

// GET single game by ID
router.get('/:id', gameController.getById);

// POST create new game
router.post('/', gameController.create);

// PUT update game
router.put('/:id', gameController.update);

// DELETE game
router.delete('/:id', gameController.delete);


module.exports = router;
