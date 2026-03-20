const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/traders — list all traders with their accounts summary
router.get("/", auth, async (req, res) => {
  try {
    const { search, filter } = req.query;

    let query = `
      SELECT 
        t.*,
        COUNT(a.id) AS account_count,
        COUNT(CASE WHEN a.status = 'FUNDED' THEN 1 END) AS funded_count,
        COALESCE(SUM(CASE WHEN p.status = 'APPROVED' THEN p.amount END), 0) AS total_withdrawn,
        COUNT(CASE WHEN p.status = 'APPROVED' THEN 1 END) AS payout_count,
        MAX(CASE WHEN p.status = 'APPROVED' THEN p.withdrawal_number END) AS max_withdrawal
      FROM traders t
      LEFT JOIN accounts a ON a.trader_id = t.id
      LEFT JOIN payouts p ON p.trader_id = t.id
    `;

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(t.name ILIKE $${params.length} OR t.email ILIKE $${params.length} OR t.volumetrica_user_id ILIKE $${params.length})`);
    }
    if (filter === "FUNDED") conditions.push(`EXISTS (SELECT 1 FROM accounts WHERE trader_id = t.id AND status = 'FUNDED')`);
    if (filter === "PENDING") conditions.push(`EXISTS (SELECT 1 FROM accounts WHERE trader_id = t.id AND status = 'PENDING_REVIEW')`);
    if (filter === "KYC_PENDING") conditions.push(`t.kyc_status != 'VERIFIED'`);

    if (conditions.length) query += ` WHERE ${conditions.join(" AND ")}`;
    query += ` GROUP BY t.id ORDER BY total_withdrawn DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("[TRADERS] GET error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/traders/:id — single trader with full details
router.get("/:id", auth, async (req, res) => {
  try {
    const traderRes = await db.query("SELECT * FROM traders WHERE id = $1", [req.params.id]);
    if (!traderRes.rows.length) return res.status(404).json({ success: false, message: "Trader not found" });

    const accountsRes = await db.query("SELECT * FROM accounts WHERE trader_id = $1 ORDER BY created_at DESC", [req.params.id]);
    const payoutsRes = await db.query("SELECT * FROM payouts WHERE trader_id = $1 ORDER BY created_at DESC", [req.params.id]);
    const auditRes = await db.query(`
      SELECT al.*, au.name as admin_name FROM audit_log al 
      LEFT JOIN admin_users au ON au.id = al.admin_id 
      WHERE al.entity_type = 'trader' AND al.entity_id = $1 
      ORDER BY al.created_at DESC LIMIT 20
    `, [req.params.id]);

    res.json({
      success: true,
      data: {
        ...traderRes.rows[0],
        accounts: accountsRes.rows,
        payouts: payoutsRes.rows,
        activity: auditRes.rows,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/traders/:id — update KYC status or notes
router.patch("/:id", auth, async (req, res) => {
  try {
    const { kyc_status, notes } = req.body;
    const fields = [], params = [];

    if (kyc_status) { params.push(kyc_status); fields.push(`kyc_status = $${params.length}`); }
    if (notes !== undefined) { params.push(notes); fields.push(`notes = $${params.length}`); }
    if (!fields.length) return res.status(400).json({ success: false, message: "Nothing to update" });

    params.push(req.params.id);
    const result = await db.query(
      `UPDATE traders SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    );

    // Audit log
    await db.query(
      "INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
      [req.admin.id, "UPDATE_TRADER", "trader", req.params.id, JSON.stringify(req.body)]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
