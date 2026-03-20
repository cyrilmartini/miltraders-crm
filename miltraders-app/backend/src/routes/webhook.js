const express = require("express");
const db = require("../db");
const vol = require("../services/volumetrica");
const { RULES } = require("../services/sync");

const router = express.Router();

// POST /api/webhook/volumetrica — receives events from Volumetrica
// Category 0 = Accounts, 1 = Positions, 2 = Subscriptions, 3 = Trade Report
router.post("/volumetrica", async (req, res) => {
  // Always respond 200 immediately so Volumetrica doesn't retry
  res.status(200).json({ received: true });

  try {
    const { category, event, data } = req.body;
    console.log(`[WEBHOOK] Category: ${category}, Event: ${event}`);

    // ── Account events ──
    if (category === 0) {
      if (event === 0) {
        // Account created
        await handleAccountCreated(data);
      } else if (event === 1) {
        // Account updated (status change, balance change)
        await handleAccountUpdated(data);
      }
    }

    // ── Trade report ──
    if (category === 3 && event === 0) {
      await handleTradeReport(data);
    }

  } catch (err) {
    console.error("[WEBHOOK] Error processing:", err.message);
  }
});

async function handleAccountCreated(data) {
  const type = vol.detectAccountType(data);
  const size = vol.detectAccountSize(data.initialBalance || 50000);
  const rules = RULES[size] || RULES[50000];
  const status = vol.mapAccountStatus(data.status);

  // Upsert trader
  const traderRes = await db.query(`
    INSERT INTO traders (volumetrica_user_id, email, name)
    VALUES ($1, $2, $3)
    ON CONFLICT (volumetrica_user_id) DO UPDATE SET updated_at = NOW()
    RETURNING id
  `, [String(data.userId), data.user?.email || "", `${data.user?.name || ""} ${data.user?.surname || ""}`.trim()]);

  const traderId = traderRes.rows[0].id;

  await db.query(`
    INSERT INTO accounts (volumetrica_account_id, trader_id, account_ref, type, size, status, balance, profit_target, max_drawdown, account_category)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (volumetrica_account_id) DO NOTHING
  `, [String(data.accountId), traderId, data.header, type, size, status, data.balance || size, rules.profitTarget, rules.maxDrawdown, type === "INSTANT" ? "INSTANT" : "EVAL"]);

  console.log(`[WEBHOOK] Account created: ${data.accountId}`);
}

async function handleAccountUpdated(data) {
  const newStatus = vol.mapAccountStatus(data.status);

  // If challenge success → mark as PENDING_REVIEW for admin validation
  let dbStatus = newStatus;
  if (data.status === 2) dbStatus = "PENDING_REVIEW"; // ChallengeSuccess

  await db.query(`
    UPDATE accounts SET
      status = $1,
      balance = COALESCE($2, balance),
      equity = COALESCE($3, equity),
      updated_at = NOW()
    WHERE volumetrica_account_id = $4
  `, [dbStatus, data.balance, data.equity, String(data.accountId)]);

  console.log(`[WEBHOOK] Account updated: ${data.accountId} → ${dbStatus}`);
}

async function handleTradeReport(data) {
  // Update account profit/balance when a trade is closed
  if (!data.accountId) return;

  await db.query(`
    UPDATE accounts SET
      balance = COALESCE($1, balance),
      profit = balance - size,
      updated_at = NOW()
    WHERE volumetrica_account_id = $2
  `, [data.closingBalance, String(data.accountId)]);
}

module.exports = router;
