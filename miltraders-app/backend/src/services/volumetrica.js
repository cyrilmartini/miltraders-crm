const axios = require("axios");

const BASE_URL = process.env.VOLUMETRICA_API_URL || "https://dxfeed.volumetricatrading.com";
const API_KEY = process.env.VOLUMETRICA_API_KEY;

const client = axios.create({
  baseURL: `${BASE_URL}/api/v2/propsite`,
  headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
  timeout: 15000,
});

// âââ Users ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
async function getUsers(params = {}) {
  const res = await client.get("/user", { params });
  if (!res.data.success) throw new Error(res.data.message || "Failed to get users");
  return res.data.data;
}

async function createUser(userData) {
  const res = await client.post("/user", { ...userData, encryptionMode: 0 });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data;
}

// âââ Trading Accounts âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
async function getTradingAccounts(params = {}) {
  const res = await client.get("/TradingAccount/List", { params });
  console.log("[VOL] tradingAccounts response:", JSON.stringify(res.data).substring(0, 500));
  if (!res.data.success) throw new Error(res.data.message || "Failed to get accounts");
  const data = res.data.data;
  // API returns paginated: { draw, recordsTotal, recordsFiltered, data: [...accounts] }
  return Array.isArray(data) ? data : (data.data || data.items || data.accounts || [data]);
}

async function getTradingAccount(accountId) {
  const res = await client.get("/tradingAccount", { params: { accountId } });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data;
}

async function enableAccount(accountId) {
  const res = await client.post("/tradingAccount/Enable", { accountId });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data;
}

async function disableAccount(accountId, reason = "", forceClose = false) {
  const res = await client.post("/tradingAccount/Disable", { accountId, reason, forceClose });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data;
}

async function changeAccountStatus(accountId, status, reason = "") {
  const res = await client.post("/tradingAccount/ChangeStatus", { accountId, status, reason });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data;
}

async function createTradingAccount(accountData) {
  const res = await client.post("/tradingAccount", accountData);
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data;
}

// âââ Trading Rules ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
async function getTradingRules() {
  const res = await client.get("/tradingRule");
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data;
}

// âââ Account status mapping âââââââââââââââââââââââââââââââââââââââââââââââââââ
// Volumetrica status codes â MILTRADERS status
function mapAccountStatus(volumetricaStatus) {
  const map = {
    0: "INITIALIZED",
    1: "ACTIVE",            // Enabled = account is active (trading)
    2: "PASSED",           // ChallengeSuccess
    4: "FAILED",           // ChallengeFailed
    8: "DISABLED",
  };
  return map[volumetricaStatus] || "UNKNOWN";
}

// âââ Account type detection from description/header ââââââââââââââââââââââââââ
function detectAccountType(account) {
  const desc = (account.description || account.header || "").toUpperCase();
  if (desc.includes("INSTANT")) return "INSTANT";
  if (desc.includes("PRO")) return "PRO";
  return "CHALLENGE";
}

// âââ Account size from balance ââââââââââââââââââââââââââââââââââââââââââââââââ
function detectAccountSize(initialBalance) {
  if (initialBalance >= 140000) return 150000;
  if (initialBalance >= 90000) return 100000;
  return 50000;
}

module.exports = {
  getUsers,
  createUser,
  getTradingAccounts,
  getTradingAccount,
  enableAccount,
  disableAccount,
  changeAccountStatus,
  createTradingAccount,
  getTradingRules,
  mapAccountStatus,
  detectAccountType,
  detectAccountSize,
};
