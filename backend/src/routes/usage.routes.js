const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const usageController = require('../controllers/usage.controller');

router.get('/summary', auth, usageController.summary);
router.get('/daily', auth, usageController.daily);
router.get('/trend', auth, usageController.trend);
router.get('/history', usageController.getUsageHistory);
module.exports = router;
