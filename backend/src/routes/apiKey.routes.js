const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const apiKeyController = require("../controllers/apiKey.controller");

router.get("/", authMiddleware, apiKeyController.getKeys);
router.post("/", authMiddleware, apiKeyController.generateKey);
router.delete("/:id", authMiddleware, apiKeyController.revokeKey);

module.exports = router;
