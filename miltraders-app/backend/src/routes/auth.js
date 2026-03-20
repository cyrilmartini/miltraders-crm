const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "miltraders_secret_change_this";

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

    const result = await db.query("SELECT * FROM admin_users WHERE email = $1", [email]);
    const admin = result.rows[0];

    if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // On first login with placeholder hash, allow password setup
    let valid = false;
    if (admin.password_hash === "$2a$10$placeholder_replace_on_first_login") {
      // First time — set the password
      const hash = await bcrypt.hash(password, 10);
      await db.query("UPDATE admin_users SET password_hash = $1 WHERE id = $2", [hash, admin.id]);
      valid = true;
    } else {
      valid = await bcrypt.compare(password, admin.password_hash);
    }

    if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name }, JWT_SECRET, { expiresIn: "24h" });

    res.json({ success: true, data: { token, admin: { id: admin.id, email: admin.email, name: admin.name } } });
  } catch (err) {
    console.error("[AUTH] Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", require("../middleware/auth"), async (req, res) => {
  res.json({ success: true, data: req.admin });
});

module.exports = router;
