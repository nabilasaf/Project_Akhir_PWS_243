const express = require("express");
const cors = require("cors");

// ROUTES
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const gameRoutes = require("./routes/game.routes");
const apiKeyRoutes = require("./routes/apiKey.routes");
const usageRoutes = require("./routes/usage.routes");
const adminRoutes = require("./routes/admin.routes");

// MIDDLEWARES
const authMiddleware = require("./middlewares/auth.middleware");
const apiKeyMiddleware = require("./middlewares/apiKey.middleware");
const flexAuthMiddleware = require("./middlewares/flexAuth.middleware");
const loggerMiddleware = require("./middlewares/logger.middleware");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   PUBLIC ROUTES
========================= */
app.use("/api/auth", authRoutes);

/* =========================
   USER DASHBOARD (JWT)
========================= */
app.use("/api/keys", authMiddleware, apiKeyRoutes);
app.use("/api/user", authMiddleware, userRoutes);
app.use("/api/usage", authMiddleware, loggerMiddleware, usageRoutes);

/* =========================
   GAME DATA (JWT OR API KEY)
========================= */
app.use(
   "/api/games",
   flexAuthMiddleware,
   loggerMiddleware,
   gameRoutes
);

/* =========================
   ADMIN (JWT)
========================= */
app.use(
   "/api/admin",
   authMiddleware,
   loggerMiddleware,
   adminRoutes
);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
   res.json({ message: "API running 🚀" });
});

module.exports = app;
