const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");
const vol = require("../services/volumetrica");
const sync = require("../services/sync");

const router = express.Router();

// GET /api/accounts — all accounts with filters
router.get("/", auth, async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = `
      SELECT a.*, t.name as trader_name, t.email as trader_email, t.kyc_status
      FROM accounts a
      JOIN traders t ON t.id = a.trader_id
    `;
    const conditions = [], params = [];
    if (status) { params.push(status); conditions.push(`a.status = $${params.length}`); }
    if (type) { params.push(type); conditions.push(`a.type = $${params.length}`); }
    if (conditions.length) query += ` WHERE ${conditions.join(" AND ")}`;
    query += ` ORDER BY a.updated_at DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/accounts/pending-reviews
router.get("/pending-reviews", auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, t.name as trader_name, t.email as trader_email, t.country, t.kyc_status, t.affiliate
      FROM accounts a
      JOIN traders t ON t.id = a.trader_id
      WHERE a.status = 'PASSED'
      ORDER BY a.updated_at ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/accounts/:id/validate — approve challenge
router.post("/:id/validate", auth, async (req, res) => {
  try {
    const accRes = await db.query("SELECT * FROM accounts WHERE id = $1", [req.params.id]);
    if (!accRes.rows.length) return res.status(404).json({ success: false, message: "Account not found" });
    const acc = accRes.rows[0];

    // Update status to FUNDED in our DB
    await db.query(
      "UPDATE accounts SET status = 'FUNDED', account_category = 'FUNDED', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );

    // Update status on Volumetrica (ChallengeSuccess = 2, then Enable = 1 for funded)
    if (acc.volumetrica_account_id) {
      await vol.changeAccountStatus(acc.volumetrica_account_id, 1, "Challenge validated by MILTRADERS admin");
    }

    // Audit log
    await db.query(
      "INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
      [req.admin.id, "VALIDATE_ACCOUNT", "account", req.params.id, JSON.stringify({ account_ref: acc.account_ref })]
    );

    res.json({ success: true, message: "Account validated and funded" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/accounts/:id/refuse — refuse challenge
router.post("/:id/refuse", auth, async (req, res) => {
  try {
    const { reasons, note } = req.body;
    const accRes = await db.query("SELECT * FROM accounts WHERE id = $1", [req.params.id]);
    if (!accRes.rows.length) return res.status(404).json({ success: false, message: "Account not found" });
    const acc = accRes.rows[0];

    await db.query(
      "UPDATE accounts SET status = 'FAILED', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );

    if (acc.volumetrica_account_id) {
      await vol.disableAccount(acc.volumetrica_account_id, reasons?.join(", ") || "Refused by admin", false);
    }

    await db.query(
      "INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
      [req.admin.id, "REFUSE_ACCOUNT", "account", req.params.id, JSON.stringify({ reasons, note })]
    );

    res.json({ success: true, message: "Account refused" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/accounts/sync — manual sync trigger
router.post("/sync", auth, async (req, res) => {
  try {
    await require("../services/sync").syncAccounts();
    res.json({ success: true, message: "Sync completed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
