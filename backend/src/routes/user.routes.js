const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

// ================= DASHBOARD =================
router.get('/dashboard', auth, userController.dashboard);
router.get('/usage', auth, userController.usage);
router.get('/logs', auth, userController.logs);

// ================= API KEY MANAGEMENT =================
router.get('/api-keys', auth, userController.getApiKeys);
router.post('/api-keys/generate', auth, userController.generateApiKey);
router.patch('/api-keys/:keyId', auth, userController.updateApiKeyStatus);
router.put('/api-keys/:keyId/revoke', auth, userController.revokeApiKey);
router.post('/api-keys/:keyId/regenerate', auth, userController.regenerateApiKey);
router.delete('/api-keys/:keyId', auth, userController.revokeApiKey);

// ================= API EXPLORE (🔥 FIXED) =================
router.get('/explore', auth, userController.getApiExplore);

module.exports = router;
