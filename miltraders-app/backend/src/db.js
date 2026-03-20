const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function init() {
  const client = await pool.connect();
  try {
    await client.query(`
      -- Admin users table
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Traders (synced from Volumetrica)
      CREATE TABLE IF NOT EXISTS traders (
        id SERIAL PRIMARY KEY,
        volumetrica_user_id VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        email VARCHAR(255),
        country VARCHAR(100),
        affiliate VARCHAR(255),
        kyc_status VARCHAR(50) DEFAULT 'NOT_DONE',
        joined_at TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Accounts (synced from Volumetrica)
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        volumetrica_account_id VARCHAR(255) UNIQUE,
        trader_id INTEGER REFERENCES traders(id),
        account_ref VARCHAR(100),
        type VARCHAR(50),
        size INTEGER,
        status VARCHAR(50),
        phase INTEGER DEFAULT 1,
        balance DECIMAL(12,2),
        equity DECIMAL(12,2),
        profit DECIMAL(12,2),
        profit_target DECIMAL(12,2),
        current_drawdown DECIMAL(12,2),
        max_drawdown DECIMAL(12,2),
        daily_limit DECIMAL(12,2),
        consistency_threshold INTEGER,
        contracts_max VARCHAR(20),
        min_daily_gain DECIMAL(12,2),
        qualifying_days INTEGER DEFAULT 0,
        cycle_days INTEGER DEFAULT 0,
        first_payout_target DECIMAL(12,2),
        buffer_lock DECIMAL(12,2),
        latent_loss DECIMAL(12,2) DEFAULT 0,
        latent_loss_limit DECIMAL(12,2),
        scalping_pct DECIMAL(5,2) DEFAULT 0,
        flipping_detected BOOLEAN DEFAULT false,
        fraud_flag BOOLEAN DEFAULT false,
        account_category VARCHAR(20),
        purchase_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Payouts
      CREATE TABLE IF NOT EXISTS payouts (
        id SERIAL PRIMARY KEY,
        trader_id INTEGER REFERENCES traders(id),
        account_id INTEGER REFERENCES accounts(id),
        account_ref VARCHAR(100),
        amount DECIMAL(12,2),
        profit_since_last DECIMAL(12,2),
        consistency_pct DECIMAL(5,2),
        qualifying_days INTEGER,
        payout_cap DECIMAL(12,2),
        withdrawal_number INTEGER,
        latent_loss BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'PENDING',
        verdict VARCHAR(50),
        refusal_reasons TEXT[],
        refusal_note TEXT,
        reviewed_by INTEGER REFERENCES admin_users(id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Audit log
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES admin_users(id),
        action VARCHAR(100),
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Insert default admin if not exists
      INSERT INTO admin_users (email, password_hash, name)
      VALUES ('admin@miltraders.com', '$2a$10$placeholder_replace_on_first_login', 'Cycy')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log("[DB] Tables initialized");
  } finally {
    client.release();
  }
}

module.exports = { pool, init, query: (text, params) => pool.query(text, params) };
