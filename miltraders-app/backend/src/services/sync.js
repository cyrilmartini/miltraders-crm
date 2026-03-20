const db = require("../db");
const vol = require("./volumetrica");

// ─── MILTRADERS rules by size ─────────────────────────────────────────────────
const RULES = {
  50000:  { profitTarget: 3000, maxDrawdown: 2000, dailyLimit: 1200, minDailyGain: 100, bufferLock: 2100, latentLossLimit: 600, contractsMax: "4/40" },
  100000: { profitTarget: 6000, maxDrawdown: 3000, dailyLimit: 2250, minDailyGain: 200, bufferLock: 3100, latentLossLimit: 900, contractsMax: "8/80" },
  150000: { profitTarget: 9000, maxDrawdown: 4500, dailyLimit: 3300, minDailyGain: 300, bufferLock: 4600, latentLossLimit: 1350, contractsMax: "12/120" },
};

const PAYOUT_CAPS = {
  50000:  [1500, 2000, 2000, 2500, 2500, 3000],
  100000: [2000, 2500, 2500, 3000, 3000, 3500],
  150000: [2500, 3000, 3000, 3500, 3500, 4000],
};

async function syncAccounts() {
  // 1. Fetch all accounts from Volumetrica
  const volAccounts = await vol.getTradingAccounts();
  if (!volAccounts || !Array.isArray(volAccounts)) {
    console.log("[SYNC] No accounts array returned:", typeof volAccounts);
    return;
  }

  for (const acc of volAccounts) {
    try {
      // 2. Detect type from rule name (e.g. "MILTRADERS CHALLENGE 50K EVAL")
      const type = detectTypeFromRule(acc.rule || acc.description || acc.header || "");
      const size = vol.detectAccountSize(acc.startBalance || acc.balance || 50000);
      const rules = RULES[size] || RULES[50000];
      const status = vol.mapAccountStatus(acc.status);

      // 3. Determine category from rule name (EVAL vs FUND) and status
      const rulePhase = detectPhaseFromRule(acc.rule || "");
      let category = "EVAL";
      if (type === "INSTANT") category = "INSTANT";
      else if (rulePhase === "FUNDED") category = "FUNDED";
      else if (acc.mode === 2) category = "FUNDED";
      else if (acc.mode === 1) category = "SIM_FUNDED";
      // Note: status "ACTIVE" (Volumetrica Enabled=1) no longer overrides category.
      // Active eval accounts have status=ACTIVE and keep category=EVAL.
      // Failed accounts keep their original category (EVAL or FUNDED) — matches TTS behavior.

      const consistencyThreshold = type === "INSTANT" ? 20 : 30;
      const profitTarget = category === "EVAL" ? rules.profitTarget : null;
      const currentBalance = Number(acc.balance) || size;
      const startBal = Number(acc.startBalance) || size;
      const profit = currentBalance - startBal;
      const currentDrawdown = Math.max(0, startBal - currentBalance);

      // Compute qualifying days from creation date
      const creationDate = acc.creationDate ? new Date(acc.creationDate) : new Date();
      const now = new Date();
      const qualifyingDays = Math.max(0, Math.floor((now - creationDate) / (1000 * 60 * 60 * 24)));

      // Compute review_status in JS to avoid SQL type conflicts
      const initialReviewStatus = (status === "PASSED" && profitTarget !== null && profit >= profitTarget && profitTarget > 0)
        ? "PENDING_REVIEW" : null;

      // 4. Upsert trader — using ownerUser or ownerAppUserId
      const userId = acc.ownerAppUserId || acc.ownerUser?.userId || acc.ownerOrganizationUserId || "unknown";
      const userEmail = acc.ownerUser?.email || acc.ownerUser?.username || "";
      const userName = acc.ownerUser?.fullName || "Unknown Trader";

      const traderRes = await db.query(`
        INSERT INTO traders (volumetrica_user_id, email, name, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (volumetrica_user_id) DO UPDATE SET
          email = COALESCE(NULLIF(EXCLUDED.email, ''), traders.email),
          name = CASE WHEN EXCLUDED.name = 'Unknown Trader' THEN traders.name ELSE EXCLUDED.name END,
          updated_at = NOW()
        RETURNING id
      `, [
        String(userId),
        userEmail,
        userName,
      ]);

      const traderId = traderRes.rows[0].id;

      // 5. Upsert account
      await db.query(`
        INSERT INTO accounts (
          volumetrica_account_id, trader_id, account_ref, type, size, status,
          balance, equity, profit, profit_target, current_drawdown, max_drawdown,
          daily_limit, consistency_threshold, contracts_max, min_daily_gain,
          first_payout_target, buffer_lock, latent_loss_limit, account_category,
          review_status, purchase_date, qualifying_days, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,NOW())
        ON CONFLICT (volumetrica_account_id) DO UPDATE SET
          trader_id = EXCLUDED.trader_id,
          type = EXCLUDED.type,
          size = EXCLUDED.size,
          status = EXCLUDED.status,
          balance = EXCLUDED.balance,
          equity = EXCLUDED.equity,
          profit = EXCLUDED.profit,
          current_drawdown = EXCLUDED.current_drawdown,
          account_category = EXCLUDED.account_category,
          account_ref = EXCLUDED.account_ref,
          qualifying_days = EXCLUDED.qualifying_days,
          review_status = CASE
            WHEN EXCLUDED.status = 'PASSED' AND EXCLUDED.profit >= EXCLUDED.profit_target AND EXCLUDED.profit_target > 0 AND accounts.review_status IS NULL THEN 'PENDING_REVIEW'
            WHEN EXCLUDED.status != 'PASSED' AND accounts.review_status = 'PENDING_REVIEW' THEN NULL
            ELSE accounts.review_status
          END,
          updated_at = NOW()
      `, [
        String(acc.accountId || acc.id),        // $1
        traderId,                                // $2
        acc.header || acc.accountId,             // $3
        type,                                    // $4
        Number(size),                            // $5 size
        status,                                  // $6 status
        Number(currentBalance),                  // $7 balance
        Number(currentBalance),                  // $8 equity
        Number(profit),                          // $9 profit
        profitTarget !== null ? Number(profitTarget) : null, // $10 profit_target
        Number(currentDrawdown),                 // $11 current_drawdown
        Number(rules.maxDrawdown),               // $12 max_drawdown
        type === "INSTANT" ? Number(rules.dailyLimit) : null, // $13 daily_limit
        Number(consistencyThreshold),            // $14 consistency_threshold
        rules.contractsMax,                      // $15 contracts_max
        Number(rules.minDailyGain),              // $16 min_daily_gain
        Number(rules.profitTarget),              // $17 first_payout_target
        category === "FUNDED" ? Number(rules.bufferLock) : null, // $18 buffer_lock
        Number(rules.latentLossLimit),           // $19 latent_loss_limit
        category,                                // $20 account_category
        initialReviewStatus,                     // $21 review_status (computed in JS)
        acc.creationDate || new Date(),          // $22 purchase_date
        Number(qualifyingDays),                  // $23 qualifying_days
      ]);

    } catch (err) {
      console.error(`[SYNC] Error syncing account ${acc.accountId || acc.header}:`, err.message);
    }
  }

  console.log(`[SYNC] Synced ${volAccounts.length} accounts`);
}

// Detect account type from Volumetrica rule name
function detectTypeFromRule(ruleName) {
  const upper = ruleName.toUpperCase();
  if (upper.includes("INSTANT") || upper.includes("ISTANT")) return "INSTANT";
  if (upper.includes("PRO")) return "PRO";
  if (upper.includes("PRIME")) return "CHALLENGE"; // "Prime 50K - Evaluation"
  return "CHALLENGE";
}

// Detect if account is EVAL or FUNDED from rule name
// TTS naming: "Phase 1" = eval, "Live" = funded
function detectPhaseFromRule(ruleName) {
  const upper = ruleName.toUpperCase();
  if (upper.includes("FUND")) return "FUNDED";
  if (upper.includes("LIVE")) return "FUNDED";
  if (upper.includes("PHASE")) return "EVAL"; // explicit "Phase 1" = eval
  return "EVAL";
}

function getPayoutCap(size, withdrawalNumber) {
  const caps = PAYOUT_CAPS[size] || PAYOUT_CAPS[100000];
  return caps[Math.min(withdrawalNumber - 1, caps.length - 1)];
}

module.exports = { syncAccounts, getPayoutCap, RULES, PAYOUT_CAPS };
