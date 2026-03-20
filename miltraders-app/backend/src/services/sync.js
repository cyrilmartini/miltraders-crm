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
  const volAccounts = await vol.getTradingAccounts();
  if (!volAccounts || !Array.isArray(volAccounts)) {
    console.log("[SYNC] No accounts array returned:", typeof volAccounts);
    return;
  }

  for (const acc of volAccounts) {
    try {
      const type = detectTypeFromRule(acc.rule || acc.description || acc.header || "");
      const size = vol.detectAccountSize(acc.startBalance || acc.balance || 50000);
      const rules = RULES[size] || RULES[50000];
      const status = vol.mapAccountStatus(acc.status);

      let category = "EVAL";
      if (type === "INSTANT") category = "INSTANT";
      else if (status === "FUNDED" || acc.mode === 2) category = "FUNDED";
      else if (acc.mode === 1) category = "SIM_FUNDED";

      const consistencyThreshold = type === "INSTANT" ? 20 : 30;
      const profitTarget = category === "EVAL" ? rules.profitTarget : null;
      const currentBalance = acc.balance || size;
      const startBal = acc.startBalance || size;
      const profit = currentBalance - startBal;
      const currentDrawdown = Math.max(0, startBal - currentBalance);

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
      `, [String(userId), userEmail, userName]);

      const traderId = traderRes.rows[0].id;

      await db.query(`
        INSERT INTO accounts (
          volumetrica_account_id, trader_id, account_ref, type, size, status,
          balance, equity, profit, profit_target, current_drawdown, max_drawdown,
          daily_limit, consistency_threshold, contracts_max, min_daily_gain,
          first_payout_target, buffer_lock, latent_loss_limit, account_category,
          purchase_date, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW())
        ON CONFLICT (volumetrica_account_id) DO UPDATE SET
          status = EXCLUDED.status, balance = EXCLUDED.balance,
          equity = EXCLUDED.equity, profit = EXCLUDED.profit,
          current_drawdown = EXCLUDED.current_drawdown,
          account_category = EXCLUDED.account_category, updated_at = NOW()
      `, [
        String(acc.accountId || acc.id), traderId, acc.header || acc.accountId,
        type, size, status, currentBalance, currentBalance, profit, profitTarget,
        currentDrawdown, rules.maxDrawdown,
        type === "INSTANT" ? rules.dailyLimit : null, consistencyThreshold,
        rules.contractsMax, rules.minDailyGain, rules.profitTarget,
        category === "FUNDED" ? rules.bufferLock : null, rules.latentLossLimit,
        category, acc.creationDate || new Date(),
      ]);
    } catch (err) {
      console.error(`[SYNC] Error syncing account ${acc.accountId || acc.header}:`, err.message);
    }
  }
  console.log(`[SYNC] Synced ${volAccounts.length} accounts`);
}

function detectTypeFromRule(ruleName) {
  const upper = ruleName.toUpperCase();
  if (upper.includes("INSTANT")) return "INSTANT";
  if (upper.includes("PRO")) return "PRO";
  return "CHALLENGE";
}

function getPayoutCap(size, withdrawalNumber) {
  const caps = PAYOUT_CAPS[size] || PAYOUT_CAPS[100000];
  return caps[Math.min(withdrawalNumber - 1, caps.length - 1)];
}

module.exports = { syncAccounts, getPayoutCap, RULES, PAYOUT_CAPS };
