const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");
const { getPayoutCap } = require("../services/sync");

const router = express.Router();

// GET /api/payouts/pending
router.get("/pending", auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, t.name as trader_name, t.email as trader_email, t.country, t.kyc_status,
             a.type as account_type, a.size as account_size, a.account_ref
      FROM payouts p
      JOIN traders t ON t.id = p.trader_id
      JOIN accounts a ON a.id = p.account_id
      WHERE p.status = 'PENDING'
      ORDER BY p.created_at ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payouts/history
router.get("/history", auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, t.name as trader_name, a.account_ref, a.type as account_type, a.size as account_size
      FROM payouts p
      JOIN traders t ON t.id = p.trader_id
      JOIN accounts a ON a.id = p.account_id
      WHERE p.status IN ('APPROVED', 'REFUSED')
      ORDER BY p.reviewed_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payouts — create payout request (from webhook or manual)
router.post("/", auth, async (req, res) => {
  try {
    const { trader_id, account_id, profit_since_last, consistency_pct, qualifying_days, withdrawal_number, latent_loss } = req.body;

    // Get account size for cap calculation
    const accRes = await db.query("SELECT size FROM accounts WHERE id = $1", [account_id]);
    if (!accRes.rows.length) return res.status(404).json({ success: false, message: "Account not found" });

    const size = accRes.rows[0].size;
    const cap = getPayoutCap(size, withdrawal_number);
    const amount = Math.min(profit_since_last * 0.9, cap);

    const result = await db.query(`
      INSERT INTO payouts (trader_id, account_id, amount, profit_since_last, consistency_pct, qualifying_days, payout_cap, withdrawal_number, latent_loss)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [trader_id, account_id, amount, profit_since_last, consistency_pct, qualifying_days, cap, withdrawal_number, latent_loss || false]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payouts/:id/approve
router.post("/:id/approve", auth, async (req, res) => {
  try {
    const result = await db.query(`
      UPDATE payouts SET status = 'APPROVED', verdict = 'APPROVED', reviewed_by = $1, reviewed_at = NOW()
      WHERE id = $2 RETURNING *
    `, [req.admin.id, req.params.id]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: "Payout not found" });

    await db.query(
      "INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
      [req.admin.id, "APPROVE_PAYOUT", "payout", req.params.id, JSON.stringify({ amount: result.rows[0].amount })]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payouts/:id/refuse
router.post("/:id/refuse", auth, async (req, res) => {
  try {
    const { reasons, note } = req.body;
    const result = await db.query(`
      UPDATE payouts SET status = 'REFUSED', verdict = 'REFUSED', refusal_reasons = $1, refusal_note = $2,
      reviewed_by = $3, reviewed_at = NOW()
      WHERE id = $4 RETURNING *
    `, [reasons || [], note || "", req.admin.id, req.params.id]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: "Payout not found" });

    await db.query(
      "INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
      [req.admin.id, "REFUSE_PAYOUT", "payout", req.params.id, JSON.stringify({ reasons, note })]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payouts/stats
router.get("/stats", auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved,
        COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN amount END), 0) as total_paid
      FROM payouts
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
