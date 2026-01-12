const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 🔐 SEMUA ADMIN WAJIB JWT
router.use(authMiddleware);

// 📊 DASHBOARD STATS
router.get('/dashboard', adminController.getDashboardStats);

// 👥 USERS
router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId/status', adminController.updateUserStatus);

// 🎮 GAMES (ADMIN VIEW — TANPA API KEY)
// 🎮 Game management (ADMIN)
router.get('/games', adminController.getAllGames);

// 🔑 API KEYS
router.get('/api-keys', adminController.getAllApiKeys);

// 📜 LOGS
router.get('/logs', adminController.getApiLogs);
router.get('/logs/stats', adminController.getSystemLogsStats);

// 📊 MONITORING
router.get('/monitoring/stats', adminController.getMonitoringStats);
router.get('/monitoring/distribution', adminController.getStatusDistribution);
router.get('/monitoring/top-endpoints', adminController.getTopEndpoints);
router.get('/monitoring/volume', adminController.getRequestVolume);
router.get('/monitoring/response-time', adminController.getResponseTimeTrend);

// 👥 UPDATE USER
router.put('/users/:userId', adminController.updateUser);


module.exports = router;
