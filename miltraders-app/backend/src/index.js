require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const authRoutes = require("./routes/auth");
const tradersRoutes = require("./routes/traders");
const accountsRoutes = require("./routes/accounts");
const payoutsRoutes = require("./routes/payouts");
const webhookRoutes = require("./routes/webhook");
const syncService = require("./services/sync");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/traders", tradersRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/payouts", payoutsRoutes);
app.use("/api/webhook", webhookRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

// ─── Sync cron — every 5 minutes ─────────────────────────────────────────────
cron.schedule("*/2 * * * *", async () => {
  try {
    await syncService.syncAccounts();
    console.log("[CRON] Accounts synced");
  } catch (err) {
    console.error("[CRON] Sync error:", err.message);
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  await db.init();
  app.listen(PORT, () => {
    console.log(`MILTRADERS backend running on port ${PORT}`);
    // Initial sync on startup
    syncService.syncAccounts().catch(console.error);
  });
}

start();
