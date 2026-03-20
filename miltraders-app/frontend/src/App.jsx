import { useState, useEffect, useRef, useCallback } from "react";
import { auth as authApi, traders as tradersApi, accounts as accountsApi, payouts as payoutsApi } from "./api.js";

// ─── FONTS & GLOBAL CSS ───────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800&family=Barlow:wght@300;400;500;600&family=IBM+Plex+Mono:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg0: #04060d;
  --bg1: #070b14;
  --bg2: #0c1120;
  --bg3: #111829;
  --bg4: #172033;
  --border: #1a2238;
  --border2: #243050;
  --gold: #b8922a;
  --gold2: #d4aa42;
  --gold-dim: #6b5218;
  --gold-glow: rgba(184,146,42,0.07);
  --gold-glow2: rgba(184,146,42,0.13);
  --text: #c8d4e8;
  --text2: #6b7fa0;
  --text3: #364560;
  --green: #2dd4a0;
  --green-bg: rgba(45,212,160,0.06);
  --green-border: rgba(45,212,160,0.18);
  --red: #e05555;
  --red-bg: rgba(224,85,85,0.07);
  --red-border: rgba(224,85,85,0.18);
  --orange: #d4813a;
  --orange-bg: rgba(212,129,58,0.07);
  --orange-border: rgba(212,129,58,0.18);
  --blue: #4a90d9;
  --blue-bg: rgba(74,144,217,0.07);
  --purple: #8b6fd4;
  --purple-bg: rgba(139,111,212,0.07);
}

body {
  background: var(--bg0);
  color: var(--text);
  font-family: 'Barlow', sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  background-image: 
    radial-gradient(ellipse at 20% 0%, rgba(184,146,42,0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(74,144,217,0.03) 0%, transparent 50%);
}

::-webkit-scrollbar { width: 2px; height: 2px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
@keyframes pageIn {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pageOut {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(-12px); }
}
.page-enter { animation: pageIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards; }

.fade-up { animation: fadeUp 0.25s cubic-bezier(0.16,1,0.3,1) forwards; }
.fade-in { animation: fadeIn 0.2s ease forwards; }

.stagger-1 { animation-delay: 0.04s; opacity: 0; }
.stagger-2 { animation-delay: 0.08s; opacity: 0; }
.stagger-3 { animation-delay: 0.12s; opacity: 0; }
.stagger-4 { animation-delay: 0.16s; opacity: 0; }
.stagger-5 { animation-delay: 0.20s; opacity: 0; }

.live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green);
  animation: pulse-dot 2.5s ease-in-out infinite;
  box-shadow: 0 0 8px var(--green);
  display: inline-block;
}

button { cursor: pointer; font-family: 'Barlow', sans-serif; }
input, select { font-family: 'Barlow', sans-serif; }
table { border-collapse: collapse; }

.hover-row:hover td { background: rgba(26,34,56,0.6) !important; }
.nav-btn:hover { color: var(--text) !important; }
.icon-btn:hover { background: var(--bg3) !important; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .sidebar { display: none !important; }
  .main-content { margin-left: 0 !important; }
  .topbar { padding-left: 14px !important; padding-right: 10px !important; }
  .topbar-search { display: none !important; }
  .kpi-grid { flex-wrap: wrap !important; }
  .kpi-grid > div { min-width: calc(50% - 6px) !important; }
  .charts-grid { grid-template-columns: 1fr !important; }
  .middle-row { grid-template-columns: 1fr !important; }
  .queue-grid { grid-template-columns: 1fr !important; }
  .checks-grid { grid-template-columns: repeat(2, 1fr) !important; }
  main { padding: 14px 12px 90px !important; }
  table { font-size: 12px; }
  th, td { padding: 9px 8px !important; }
  .mobile-nav { display: flex !important; }

  /* Bigger text in cards on mobile */
  .checks-grid .check-label { font-size: 10px !important; }
  .checks-grid .check-value { font-size: 16px !important; }
  .checks-grid .check-required { font-size: 10px !important; }

  /* Topbar title smaller */
  .topbar-title { font-size: 20px !important; }

  /* Category badge row wraps */
  .category-row { flex-wrap: wrap !important; gap: 6px !important; font-size: 11px !important; }

  /* Verdict box */
  .verdict-label { font-size: 14px !important; }
  .verdict-msg { font-size: 12px !important; }

  /* Drawdown bar label */
  .dd-label { font-size: 12px !important; }
  .dd-value { font-size: 12px !important; }

  /* Account row header */
  .account-header span { font-size: 12px !important; }
}
@media (max-width: 480px) {
  .kpi-grid > div { min-width: 100% !important; }
  .checks-grid { grid-template-columns: 1fr 1fr !important; }
}
.mobile-nav { display: none; }

/* Noise texture overlay */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
  opacity: 0.4;
}
`;

// ─── MONO STYLE ───────────────────────────────────────────────────────────────
const MONO = { fontFamily: "'IBM Plex Mono', monospace" };

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// TRADERS data loaded from API — see useData hook below
const TRADERS_MOCK = []; // kept for initial render only

const REFUSAL_REASONS = [
  "Consistency rule not met (< 30%)",
  "Insufficient qualifying days (< 5)",
  "Micro-scalping > 40%",
  "Flipping detected",
  "Max drawdown breached",
  "Profit target not reached",
  "Latent loss on open positions",
  "Fraud / copy trading suspected",
  "KYC not completed",
  "Other",
];

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#C9A84C", width = 80, height = 28 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  const fillPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ label, size = "sm" }) {
  const map = {
    FUNDED: { bg: "var(--green-bg)", c: "var(--green)", b: "var(--green-border)" },
    PENDING_REVIEW: { bg: "var(--orange-bg)", c: "var(--orange)", b: "var(--orange-border)" },
    FAILED: { bg: "var(--red-bg)", c: "var(--red)", b: "var(--red-border)" },
    PASSED: { bg: "var(--gold-glow2)", c: "var(--gold)", b: "rgba(201,168,76,0.25)" },
    CHALLENGE: { bg: "var(--purple-bg)", c: "var(--purple)", b: "rgba(167,139,250,0.2)" },
    PRO: { bg: "var(--gold-glow2)", c: "var(--gold)", b: "rgba(201,168,76,0.2)" },
    INSTANT: { bg: "var(--blue-bg)", c: "var(--blue)", b: "rgba(96,165,250,0.2)" },
    PAID: { bg: "var(--green-bg)", c: "var(--green)", b: "var(--green-border)" },
    VERIFIED: { bg: "var(--green-bg)", c: "var(--green)", b: "var(--green-border)" },
    PENDING: { bg: "var(--orange-bg)", c: "var(--orange)", b: "var(--orange-border)" },
    REFUSED: { bg: "var(--red-bg)", c: "var(--red)", b: "var(--red-border)" },
    FLAG: { bg: "var(--red-bg)", c: "var(--red)", b: "var(--red-border)" },
  };
  const s = map[label] || { bg: "var(--bg3)", c: "var(--text2)", b: "var(--border)" };
  const pad = size === "sm" ? "2px 8px" : "4px 12px";
  const fs = size === "sm" ? 9 : 11;
  return (
    <span style={{ ...MONO, fontSize: fs, fontWeight: 500, letterSpacing: "0.07em", padding: pad, borderRadius: 1, background: s.bg, color: s.c, border: `1px solid ${s.b}`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

// ─── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, sparkData, color = "var(--gold)", icon, delay = 0 }) {
  const trendUp = trend > 0;
  return (
    <div className="fade-up" style={{
      animationDelay: `${delay}s`, opacity: 0,
      background: "var(--bg1)", border: "1px solid var(--border)",
      borderTop: `2px solid ${color}`,
      padding: "18px 20px", flex: 1, minWidth: 150,
      position: "relative", overflow: "hidden",
      clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)",
    }}>
      <div style={{ position: "absolute", bottom: 8, right: 10, opacity: 0.25 }}>
        <Sparkline data={sparkData} color={color} />
      </div>
      <div style={{ ...MONO, fontSize: 9, color: "var(--text3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>{label}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 600, color, letterSpacing: "-0.01em", lineHeight: 1 }}>{value}</div>
      {(sub || trend !== undefined) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          {sub && <span style={{ ...MONO, fontSize: 9, color: "var(--text3)", letterSpacing: "0.06em" }}>{sub}</span>}
          {trend !== undefined && (
            <span style={{ ...MONO, fontSize: 9, color: trendUp ? "var(--green)" : "var(--red)" }}>
              {trendUp ? "↑" : "↓"}{Math.abs(trend)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DONUT CHART ──────────────────────────────────────────────────────────────
function DonutChart({ data, size = 72 }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  let cumulative = 0;
  const r = size / 2 - 8;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size}>
      {data.map((d, i) => {
        const pct = d.value / total;
        const offset = circumference * (1 - cumulative);
        const dash = circumference * pct;
        cumulative += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={d.color} strokeWidth={6}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "all 0.5s ease" }}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r - 8} fill="var(--bg1)" />
    </svg>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = "var(--gold)", height = 4 }) {
  const pct = Math.min((value / max) * 100, 100);
  const c = value < 30 ? "var(--red)" : value < 60 ? "var(--orange)" : color;
  return (
    <div style={{ height, background: "var(--bg3)", overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: c, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="fade-up" style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 2, padding: 28, maxWidth: 480, width: "90%", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.04em" }}>{title}</div>
          <button onClick={onClose} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 1, padding: "4px 10px", color: "var(--text2)", fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── REFUSAL MODAL ────────────────────────────────────────────────────────────
function RefusalModal({ onClose, onConfirm, title = "Refusal Reasons" }) {
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState("");
  const toggle = r => setSelected(s => s.includes(r) ? s.filter(x => x !== r) : [...s, r]);
  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ marginBottom: 16 }}>
        {REFUSAL_REASONS.map(r => (
          <label key={r} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 2, cursor: "pointer", marginBottom: 4, background: selected.includes(r) ? "var(--red-bg)" : "transparent", border: `1px solid ${selected.includes(r) ? "var(--red-border)" : "transparent"}`, transition: "all 0.15s" }}>
            <input type="checkbox" checked={selected.includes(r)} onChange={() => toggle(r)} style={{ accentColor: "var(--red)", width: 14, height: 14 }} />
            <span style={{ fontSize: 13, color: selected.includes(r) ? "var(--red)" : "var(--text2)" }}>{r}</span>
          </label>
        ))}
      </div>
      <textarea
        placeholder="Additional notes (optional)…"
        value={note} onChange={e => setNote(e.target.value)}
        style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 2, padding: "10px 14px", color: "var(--text)", fontSize: 12, resize: "vertical", minHeight: 70, outline: "none", marginBottom: 16, ...MONO }}
      />
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 2, color: "var(--text2)", fontSize: 13 }}>Cancel</button>
        <button onClick={() => selected.length && onConfirm(selected, note)} style={{ flex: 1, padding: "11px", background: selected.length ? "var(--red)" : "var(--bg3)", border: "none", borderRadius: 2, color: selected.length ? "#fff" : "var(--text3)", fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}>
          Confirm Refusal
        </button>
      </div>
    </Modal>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@miltraders.com");
  const [pass, setPass] = useState("Admin2026!");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    onLogin();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg0)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {/* Background grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.25 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--border2) 1px, transparent 1px), linear-gradient(90deg, var(--border2) 1px, transparent 1px)", backgroundSize: "300px 300px", opacity: 0.15 }} />
      {/* Glow */}
      <div style={{ position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(184,146,42,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div className="fade-up" style={{ position: "relative", width: 380, background: "var(--bg1)", border: "1px solid var(--border)", padding: "44px 40px", clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)" }}>
        {/* Corner accent */}
        <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 16px 16px 0", borderColor: "transparent var(--gold) transparent transparent", opacity: 0.6 }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, var(--gold) 0%, transparent 60%)` }} />
        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, background: "var(--bg3)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}>
              <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", fontFamily: "'Barlow Condensed', sans-serif" }}>MT</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text)" }}>MILTRADERS</div>
              <div style={{ ...MONO, fontSize: 9, color: "var(--gold-dim)", letterSpacing: "0.18em" }}>ADMIN PORTAL · DUBAI UAE</div>
            </div>
          </div>
          <div style={{ height: "1px", background: "var(--border)", marginTop: 20 }} />
        </div>

        {[
          { label: "Email address", type: "email", val: email, set: setEmail, placeholder: "admin@miltraders.com" },
          { label: "Password", type: "password", val: pass, set: setPass, placeholder: "••••••••••••" },
        ].map(({ label, type, val, set, placeholder }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>{label}</label>
            <input
              type={type} value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ width: "100%", background: "var(--bg0)", border: "none", borderBottom: "1px solid var(--border2)", padding: "11px 0", color: "var(--text)", fontSize: 14, outline: "none", transition: "border-color 0.15s", ...MONO }}
              onFocus={e => e.target.style.borderBottomColor = "var(--gold)"}
              onBlur={e => e.target.style.borderBottomColor = "var(--border2)"}
            />
          </div>
        ))}

        {err && <div style={{ ...MONO, fontSize: 11, color: "var(--red)", marginBottom: 12, padding: "8px 12px", background: "var(--red-bg)", borderRadius: 1, border: "1px solid var(--red-border)" }}>⚠ {err}</div>}

        <button onClick={submit} disabled={loading} style={{
          width: "100%", padding: "13px", marginTop: 8,
          background: loading ? "var(--bg3)" : "transparent",
          border: `1px solid ${loading ? "var(--border)" : "var(--gold)"}`,
          color: loading ? "var(--text3)" : "var(--gold)",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 600, fontSize: 15, letterSpacing: "0.14em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s", clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)"
        }}>
          {loading ? <><span style={{ width: 14, height: 14, border: "2px solid var(--text3)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Authenticating…</> : "SIGN IN →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <span style={{ ...MONO, fontSize: 9, color: "var(--text3)", letterSpacing: "0.08em" }}>admin@miltraders.com · Admin2026!</span>
        </div>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ pageTitle, onLogout, setPage }) {
  const now = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const searchResults = searchQuery.length < 2 ? [] : [
    ...TRADERS.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(t => ({ type: "trader", name: t.name, sub: t.email + " · " + t.id, page: "traders" })),
    ...TRADERS.flatMap(t => t.accounts.filter(a =>
      a.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(a => ({ type: "account", name: a.id, sub: t.name + " · " + a.type + " · $" + a.size.toLocaleString(), page: "traders" }))),
  ].slice(0, 8);
  const notifications = [
    { id: 1, text: "New payout request — Alexandre Roux", time: "2m ago", type: "payout" },
    { id: 2, text: "Challenge pending review — Sofia Nakamura", time: "14m ago", type: "review" },
    { id: 3, text: "Micro-scalping flagged — MT-0078", time: "14m ago", type: "flag" },
    { id: 4, text: "Payout request — Kevin Marchetti", time: "1h ago", type: "payout" },
  ];

  return (
    <div className="topbar" style={{ height: 52, background: "var(--bg0)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", paddingLeft: 28, paddingRight: 24, gap: 16, position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
      <div style={{ flex: 1 }}>
        <span className="topbar-title" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text)" }}>{pageTitle.toUpperCase()}</span>
      </div>

      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span className="live-dot" />
        <span style={{ ...MONO, fontSize: 10, color: "var(--text3)" }}>{now}</span>
      </div>

      {/* Global Search */}
      <div className="topbar-search" style={{ position: "relative" }}>
        <input
          placeholder="Search trader, account, ID…"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setSearchOpen(e.target.value.length > 0); }}
          onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          onFocus={() => searchQuery.length > 0 && setSearchOpen(true)}
          style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderBottom: searchOpen ? "1px solid var(--gold)" : "1px solid var(--border)", padding: "7px 14px 7px 34px", color: "var(--text)", fontSize: 12, outline: "none", width: 220, ...MONO }}
        />
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 13 }}>⌕</span>
        {searchOpen && searchResults.length > 0 && (
          <div className="fade-in" style={{ position: "absolute", top: 38, left: 0, right: 0, background: "var(--bg2)", border: "1px solid var(--border2)", zIndex: 200, maxHeight: 300, overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
            {searchResults.map((r, i) => (
              <div key={i} onClick={() => { setPage(r.page); setSearchQuery(""); setSearchOpen(false); }}
                style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ ...MONO, fontSize: 9, color: r.type === "trader" ? "var(--gold)" : "var(--blue)", background: r.type === "trader" ? "var(--gold-glow)" : "var(--blue-bg)", padding: "2px 7px", border: `1px solid ${r.type === "trader" ? "rgba(184,146,42,0.2)" : "rgba(74,144,217,0.2)"}` }}>
                  {r.type === "trader" ? "TRADER" : "ACCOUNT"}
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{r.name}</div>
                  <div style={{ ...MONO, fontSize: 10, color: "var(--text3)" }}>{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {searchOpen && searchResults.length === 0 && searchQuery.length >= 2 && (
          <div style={{ position: "absolute", top: 38, left: 0, right: 0, background: "var(--bg2)", border: "1px solid var(--border2)", padding: "14px", zIndex: 200 }}>
            <span style={{ ...MONO, fontSize: 11, color: "var(--text3)" }}>No results for "{searchQuery}"</span>
          </div>
        )}
      </div>

      {/* Notif */}
      <div style={{ position: "relative" }}>
        <button className="icon-btn" onClick={() => setNotifOpen(o => !o)} style={{ width: 36, height: 36, borderRadius: 2, background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--text2)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          🔔
          <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: "var(--red)", borderRadius: "50%", border: "2px solid var(--bg1)" }} />
        </button>
        {notifOpen && (
          <div className="fade-in" style={{ position: "absolute", right: 0, top: 44, width: 300, background: "var(--bg2)", border: "1px solid var(--border2)", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", zIndex: 100 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>Notifications</div>
            {notifications.map(n => (
              <div key={n.id} style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ fontSize: 16 }}>{n.type === "payout" ? "💰" : n.type === "flag" ? "🚩" : "📋"}</span>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>{n.text}</div>
                  <div style={{ ...MONO, fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 12px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, var(--gold), var(--gold2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#000" }}>C</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>Cycy</div>
          <div style={{ ...MONO, fontSize: 9, color: "var(--gold-dim)" }}>ADMIN</div>
        </div>
        <button onClick={onLogout} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 14, marginLeft: 4 }}>⏻</button>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview", label: "Overview", emoji: "◈" },
  { id: "reviews", label: "Reviews", emoji: "◉" },
  { id: "payouts", label: "Payouts", emoji: "◎" },
  { id: "traders", label: "Traders", emoji: "◷" },
  { id: "risk", label: "Risk Monitor", emoji: "◬" },
  { id: "settings", label: "Settings", emoji: "⊕" },
];

function Sidebar({ page, setPage }) {
  const pendingReviews = TRADERS.flatMap(t => t.accounts.filter(a => a.status === "PENDING_REVIEW")).length;
  const pendingPayouts = TRADERS.filter(t => t.pendingPayout).length;
  const badges = { reviews: pendingReviews, payouts: pendingPayouts };

  return (
    <aside className="sidebar" style={{ width: 210, background: "var(--bg0)", borderRight: "1px solid var(--border)", height: "100vh", position: "fixed", left: 0, top: 0, display: "flex", flexDirection: "column", zIndex: 40 }}>
      {/* Logo */}
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--border)", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, var(--gold) 0%, transparent 70%)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 30, height: 30, background: "var(--bg3)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, clipPath: "polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 0 100%)" }}>
            <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", fontFamily: "'Barlow Condensed', sans-serif" }}>MT</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text)" }}>MILTRADERS</div>
            <div style={{ ...MONO, fontSize: 8, color: "var(--gold-dim)", letterSpacing: "0.14em" }}>PROP FIRM · ADMIN</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
        <div style={{ ...MONO, fontSize: 8, color: "var(--text3)", letterSpacing: "0.16em", padding: "4px 14px 8px", textTransform: "uppercase", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>Operations</div>
        {NAV_ITEMS.map(n => {
          const active = page === n.id;
          const badge = badges[n.id];
          return (
            <button key={n.id} className="nav-btn" onClick={() => setPage(n.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px 8px 14px",
              border: "none", marginBottom: 1,
              background: "transparent",
              color: active ? "var(--text)" : "var(--text3)",
              fontSize: 13, fontWeight: active ? 600 : 400, textAlign: "left",
              transition: "all 0.12s",
              borderLeft: active ? "2px solid var(--gold)" : "2px solid transparent",
              letterSpacing: active ? "0.04em" : "0.02em",
            }}>
              <span style={{ ...MONO, fontSize: 10, opacity: active ? 0.8 : 0.35, color: active ? "var(--gold)" : "var(--text2)", minWidth: 14 }}>{n.emoji}</span>
              <span style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: "0.06em" }}>{n.label.toUpperCase()}</span>
              {badge > 0 && (
                <span style={{ ...MONO, fontSize: 9, background: "var(--gold)", color: "#000", borderRadius: 2, padding: "1px 7px", fontWeight: 700 }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Version */}
      <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ ...MONO, fontSize: 9, color: "var(--text3)" }}>v1.0.0 · Mock Data Mode</div>
      </div>
    </aside>
  );
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
function Overview({ setPage }) {
  const allAccounts = TRADERS.flatMap(t => t.accounts);
  const funded = allAccounts.filter(a => a.status === "FUNDED").length;
  const pendingReview = allAccounts.filter(a => a.status === "PENDING_REVIEW").length;
  const failed = allAccounts.filter(a => a.status === "FAILED").length;
  const totalWithdrawn = TRADERS.reduce((a, t) => a + t.totalWithdrawn, 0);
  const pendingPayouts = TRADERS.filter(t => t.pendingPayout).length;
  const totalTraders = TRADERS.length;

  const typeBreakdown = [
    { label: "CHALLENGE", value: allAccounts.filter(a => a.type === "CHALLENGE").length, color: "var(--purple)" },
    { label: "PRO", value: allAccounts.filter(a => a.type === "PRO").length, color: "var(--gold)" },
    { label: "INSTANT", value: allAccounts.filter(a => a.type === "INSTANT").length, color: "var(--blue)" },
  ];

  const recentActivity = TRADERS.flatMap(t =>
    t.activity.map(a => ({ ...a, trader: t.name }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  const topTraders = [...TRADERS].sort((a, b) => b.totalWithdrawn - a.totalWithdrawn).slice(0, 4);

  return (
    <div>
      {/* KPI row */}
      <div className="kpi-grid" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <KpiCard label="Total Traders" value={totalTraders} sub="Registered" sparkData={[3, 4, 4, 5, 5, 6]} delay={0.05} />
        <KpiCard label="Funded Accounts" value={funded} sub="Active" sparkData={[1, 2, 2, 3, 3, 4]} color="var(--green)" delay={0.1} />
        <KpiCard label="Pending Reviews" value={pendingReview} sub="Awaiting" sparkData={[0, 1, 2, 3, 4, 4]} color="var(--orange)" delay={0.15} />
        <KpiCard label="Pending Payouts" value={pendingPayouts} sub="Requests" sparkData={[0, 1, 1, 2, 2, 3]} color="var(--blue)" delay={0.2} />
        <KpiCard label="Total Paid Out" value={"$" + (totalWithdrawn / 1000).toFixed(1) + "k"} sub="All time" sparkData={[2, 5, 8, 12, 18, 25]} trend={12} delay={0.25} />
      </div>

      {/* Middle row */}
      <div className="middle-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr", gap: 16, marginBottom: 20 }}>
        {/* Account breakdown */}
        <div className="fade-up stagger-3" style={{ background: "var(--bg1)", border: "1px solid var(--border)", padding: "20px 22px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", marginBottom: 16, textTransform: "uppercase" }}>Account Types</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <DonutChart data={typeBreakdown} size={80} />
            <div style={{ flex: 1 }}>
              {typeBreakdown.map(t => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.color }} />
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>{t.label}</span>
                  </div>
                  <span style={{ ...MONO, fontSize: 12, color: t.color }}>{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pass rate */}
        <div className="fade-up stagger-4" style={{ background: "var(--bg1)", border: "1px solid var(--border)", padding: "20px 22px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", marginBottom: 16, textTransform: "uppercase" }}>Status Breakdown</div>
          {[
            { label: "Funded", value: funded, total: allAccounts.length, color: "var(--green)" },
            { label: "Pending Review", value: pendingReview, total: allAccounts.length, color: "var(--orange)" },
            { label: "Failed", value: failed, total: allAccounts.length, color: "var(--red)" },
          ].map(({ label, value, total, color }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>{label}</span>
                <span style={{ ...MONO, fontSize: 11, color }}>{value} <span style={{ color: "var(--text3)" }}>/ {total}</span></span>
              </div>
              <ProgressBar value={value} max={total} color={color} />
            </div>
          ))}
        </div>

        {/* Top traders */}
        <div className="fade-up stagger-5" style={{ background: "var(--bg1)", border: "1px solid var(--border)", padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", textTransform: "uppercase" }}>Top Traders</div>
            <button onClick={() => setPage("traders")} style={{ ...MONO, fontSize: 10, color: "var(--gold)", background: "none", border: "none" }}>View all →</button>
          </div>
          {topTraders.map((t, i) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ ...MONO, fontSize: 11, color: "var(--text3)", width: 14 }}>#{i + 1}</div>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--gold)", flexShrink: 0 }}>
                {t.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</div>
                <div style={{ ...MONO, fontSize: 10, color: "var(--text3)" }}>{t.accounts.length} accounts</div>
              </div>
              <div style={{ ...MONO, fontSize: 12, color: "var(--green)" }}>${t.totalWithdrawn.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* Pass Rate chart */}
        <div className="fade-up" style={{ background: "var(--bg1)", border: "1px solid var(--border)", padding: "18px 20px" }}>
          <div style={{ ...MONO, fontSize: 9, color: "var(--text3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Pass Rate — 8 weeks</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 52, marginBottom: 8 }}>
            {[38,42,35,55,48,62,58,70].map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", background: i === 7 ? "var(--gold)" : "var(--border2)", height: `${v}%`, transition: "height 0.4s ease" }} />
                <span style={{ ...MONO, fontSize: 7, color: "var(--text3)" }}>W{i+1}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ ...MONO, fontSize: 10, color: "var(--text3)" }}>Avg 51%</span>
            <span style={{ ...MONO, fontSize: 11, color: "var(--gold)", fontWeight: 500 }}>+12% vs last week</span>
          </div>
        </div>

        {/* Payout volume chart */}
        <div className="fade-up" style={{ background: "var(--bg1)", border: "1px solid var(--border)", padding: "18px 20px" }}>
          <div style={{ ...MONO, fontSize: 9, color: "var(--text3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Payout Volume — 6 months</div>
          <svg width="100%" height="52" viewBox="0 0 200 52" preserveAspectRatio="none">
            <defs>
              <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b8922a" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#b8922a" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <polygon points="0,52 0,42 33,36 66,28 100,20 133,14 166,8 200,4 200,52" fill="url(#payGrad)"/>
            <polyline points="0,42 33,36 66,28 100,20 133,14 166,8 200,4" fill="none" stroke="#b8922a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="200" cy="4" r="3" fill="#b8922a"/>
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ ...MONO, fontSize: 10, color: "var(--text3)" }}>Jan → now</span>
            <span style={{ ...MONO, fontSize: 11, color: "var(--green)", fontWeight: 500 }}>$25.3k total</span>
          </div>
        </div>

        {/* Account status donut + breakdown */}
        <div className="fade-up" style={{ background: "var(--bg1)", border: "1px solid var(--border)", padding: "18px 20px" }}>
          <div style={{ ...MONO, fontSize: 9, color: "var(--text3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Account Health</div>
          {(() => {
            const all = TRADERS.flatMap(t => t.accounts);
            const rows = [
              { label: "Funded", count: all.filter(a => a.status === "FUNDED").length, color: "var(--green)" },
              { label: "In Review", count: all.filter(a => a.status === "PENDING_REVIEW").length, color: "var(--orange)" },
              { label: "Failed", count: all.filter(a => a.status === "FAILED").length, color: "var(--red)" },
            ];
            return (
              <div>
                {rows.map(r => (
                  <div key={r.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ ...MONO, fontSize: 10, color: "var(--text2)" }}>{r.label}</span>
                      <span style={{ ...MONO, fontSize: 10, color: r.color }}>{r.count}</span>
                    </div>
                    <div style={{ height: 3, background: "var(--bg3)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(r.count / all.length) * 100}%`, background: r.color, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Activity feed */}
      <div className="fade-up" style={{ background: "var(--bg1)", border: "1px solid var(--border)", padding: "20px 22px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", marginBottom: 16, textTransform: "uppercase" }}>Recent Activity</div>
        {recentActivity.map((a, i) => {
          const icons = { PAYOUT_REQUEST: "💰", PAYOUT_PAID: "✅", FLAG: "🚩", FAILED: "❌", SIGNUP: "👤", PURCHASE: "🛒" };
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: i < recentActivity.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 16, lineHeight: 1.4 }}>{icons[a.type] || "•"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}><span style={{ color: "var(--gold)", fontWeight: 500 }}>{a.trader}</span> — {a.note}</div>
                <div style={{ ...MONO, fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{a.date}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── REVIEWS PAGE ─────────────────────────────────────────────────────────────
function ReviewCard({ account, trader }) {
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState(false);
  const [verdict, setVerdict] = useState(null);

  // ── MILTRADERS full rule logic ──
  const isEval = account.accountCategory === "EVAL";
  const isInstant = account.accountCategory === "INSTANT";
  const isFunded = account.accountCategory === "FUNDED";
  const consistencyThreshold = account.consistencyThreshold || (isInstant ? 20 : 30);
  const profitTargetOk = account.profitTarget ? account.profit >= account.profitTarget : true;
  const drawdownOk = account.currentDrawdown <= account.maxDrawdown;
  const qualifyingDaysOk = (account.qualifyingDays || account.days) >= 5;
  const cycleDaysOk = (account.cycleDays || account.days) >= (isEval ? 2 : 7);
  const consistencyOk = account.consistency < consistencyThreshold;
  const scalpingFlag = account.scalping > 40; // INFO only, does not block
  const latentLossOk = !account.latentLoss || account.latentLoss <= (account.latentLossLimit || 999999);

  // EVAL checks (Challenge/Pro evaluation phase)
  const evalChecks = [
    { label: "Profit target", value: "$" + account.profit.toLocaleString(), ok: profitTargetOk, required: account.profitTarget ? "$" + account.profitTarget.toLocaleString() : "N/A", blocking: true },
    { label: "Min trading days", value: (account.cycleDays || account.days) + " jours", ok: cycleDaysOk, required: "≥ 2 jours", blocking: false },
    { label: "Max drawdown", value: "$" + account.currentDrawdown.toLocaleString(), ok: drawdownOk, required: "≤ $" + account.maxDrawdown.toLocaleString(), blocking: true },
    { label: "Consistency", value: account.consistency + "%", ok: consistencyOk, required: "< " + consistencyThreshold + "%", blocking: false },
    { label: "Micro-scalping", value: account.scalping + "%", ok: !scalpingFlag, required: "≤ 40% (info)", blocking: false, infoOnly: true },
    { label: "Flipping", value: account.flipping ? "Détecté" : "Aucun", ok: !account.flipping, required: "Aucun (info)", blocking: false, infoOnly: true },
  ];

  // FUNDED/INSTANT checks (payout validation — 6 checks)
  const payoutChecks = [
    { label: "Check 1 — Payout target", value: "$" + account.profit.toLocaleString(), ok: profitTargetOk, required: account.firstPayoutTarget ? "Atteindre $" + account.firstPayoutTarget.toLocaleString() : "N/A (déjà fait)", blocking: true, note: "1er payout uniquement" },
    { label: "Check 2 — Jours cycle", value: (account.cycleDays || account.days) + " jours", ok: cycleDaysOk, required: "≥ 7 jours", blocking: false },
    { label: "Check 3 — Qualifying days", value: (account.qualifyingDays || 0) + " jours", ok: qualifyingDaysOk, required: "≥ 5 jours (PnL ≥ $" + (account.minDailyGain || 100) + "/j)", blocking: false },
    { label: "Check 4 — Flipping", value: account.flipping ? "Détecté" : "Aucun", ok: true, required: "Info seulement", blocking: false, infoOnly: true },
    { label: "Check 5 — Consistency", value: account.consistency + "%", ok: consistencyOk, required: "< " + consistencyThreshold + "% du profit cycle", blocking: false },
    { label: "Check 6 — Latent loss", value: account.latentLoss ? "$" + account.latentLoss.toLocaleString() : "$0", ok: latentLossOk, required: "≤ 30% du DD max ($" + (account.latentLossLimit || "—") + ")", blocking: false },
    { label: "Max drawdown", value: "$" + account.currentDrawdown.toLocaleString(), ok: drawdownOk, required: "≤ $" + account.maxDrawdown.toLocaleString(), blocking: true },
    { label: "Micro-scalping", value: account.scalping + "%", ok: true, required: "Info seulement (>40%)", blocking: false, infoOnly: scalpingFlag },
  ];

  const checks = isEval ? evalChecks : payoutChecks;
  const blockingFails = checks.filter(c => !c.ok && c.blocking);
  const softFails = checks.filter(c => !c.ok && !c.blocking && !c.infoOnly);
  const allOk = blockingFails.length === 0 && softFails.length === 0;

  return (
    <>
      {modal && <RefusalModal title={`Refuse — ${account.id}`} onClose={() => setModal(false)} onConfirm={(r, n) => { setVerdict({ type: "REFUSED", reasons: r, note: n }); setModal(false); }} />}
      <div style={{ background: "var(--bg2)", border: `1px solid ${verdict ? (verdict.type === "REFUSED" ? "var(--red-border)" : "var(--green-border)") : "var(--border)"}`, marginBottom: 8, overflow: "hidden", borderLeft: "2px solid var(--border2)", transition: "border-color 0.2s" }}>
        {/* Header */}
        <div onClick={() => !verdict && setExpanded(e => !e)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: verdict ? "default" : "pointer" }}>
          <Badge label={account.type} />
          <span style={{ ...MONO, fontSize: 13, color: "var(--text2)" }}>{account.id}</span>
          <span style={{ ...MONO, fontSize: 13, color: "var(--gold)", fontWeight: 500 }}>${account.size.toLocaleString()}</span>
          <span style={{ fontSize: 12, color: account.profit >= 0 ? "var(--green)" : "var(--red)" }}>{account.profit >= 0 ? "+" : ""}{((account.profit / account.size) * 100).toFixed(2)}%</span>
          <div style={{ flex: 1 }} />
          {!allOk && !verdict && <span style={{ ...MONO, fontSize: 9, color: "var(--red)", background: "var(--red-bg)", padding: "2px 8px", borderRadius: 1, border: "1px solid var(--red-border)" }}>⚠ FLAGS DETECTED</span>}
          {verdict ? (
            <Badge label={verdict.type === "REFUSED" ? "REFUSED" : "FUNDED"} />
          ) : (
            <span style={{ ...MONO, fontSize: 10, color: "var(--text3)" }}>{expanded ? "▲" : "▼"}</span>
          )}
        </div>

        {/* Expanded */}
        {expanded && !verdict && (
          <div className="fade-up" style={{ padding: "0 18px 18px", borderTop: "1px solid var(--border)" }}>
            {/* Category badge */}
            <div className="category-row" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 12 }}>
              <span style={{ ...MONO, fontSize: 10, padding: "3px 10px", borderRadius: 1, background: isEval ? "var(--purple-bg)" : isInstant ? "var(--blue-bg)" : "var(--green-bg)", color: isEval ? "var(--purple)" : isInstant ? "var(--blue)" : "var(--green)", border: `1px solid ${isEval ? "rgba(167,139,250,0.2)" : isInstant ? "rgba(96,165,250,0.2)" : "var(--green-border)"}` }}>
                {isEval ? "ÉVALUATION" : isInstant ? "INSTANT FUNDED" : "FUNDED"}
              </span>
              <span style={{ ...MONO, fontSize: 11, color: "var(--text3)" }}>
                Consistency seuil: {consistencyThreshold}% · Contrats: {account.contractsMax || "—"} · Min daily gain: ${account.minDailyGain || "—"}
              </span>
              {account.bufferLock && <span style={{ ...MONO, fontSize: 10, color: "var(--gold)", padding: "2px 8px", borderRadius: 1, background: "var(--gold-glow)", border: "1px solid rgba(201,168,76,0.2)" }}>Buffer lock: ${account.bufferLock.toLocaleString()}</span>}
            </div>

            {/* Checks grid */}
            <div className="checks-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
              {checks.map(({ label, value, ok, required, infoOnly, note }) => {
                const bgColor = infoOnly ? "var(--bg3)" : ok ? "var(--green-bg)" : "var(--red-bg)";
                const borderColor = infoOnly ? "var(--border)" : ok ? "var(--green-border)" : "var(--red-border)";
                const textColor = infoOnly ? "var(--orange)" : ok ? "var(--green)" : "var(--red)";
                return (
                  <div key={label} style={{ background: bgColor, border: `1px solid ${borderColor}`, padding: "10px 12px" }}>
                    <div className="check-label" style={{ fontSize: 10, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                    <div className="check-value" style={{ ...MONO, fontSize: 15, color: textColor, fontWeight: 400 }}>{value}</div>
                    <div className="check-required" style={{ ...MONO, fontSize: 10, color: "var(--text3)", marginTop: 4 }}>{required}</div>
                    {infoOnly && <div style={{ ...MONO, fontSize: 10, color: "var(--orange)", marginTop: 3 }}>Info only</div>}
                    {note && <div style={{ ...MONO, fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{note}</div>}
                  </div>
                );
              })}
            </div>

            {/* Drawdown bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span className="dd-label" style={{ fontSize: 11, color: "var(--text2)" }}>Drawdown utilisé</span>
                <span className="dd-value" style={{ ...MONO, fontSize: 11, color: account.currentDrawdown > account.maxDrawdown * 0.8 ? "var(--orange)" : "var(--green)" }}>${account.currentDrawdown.toLocaleString()} / ${account.maxDrawdown.toLocaleString()}</span>
              </div>
              <ProgressBar value={account.currentDrawdown} max={account.maxDrawdown} color={account.currentDrawdown > account.maxDrawdown * 0.8 ? "var(--orange)" : "var(--green)"} height={6} />
            </div>

            {/* AI Verdict suggestion */}
            {(() => {
              const verdict = blockingFails.length > 0 ? "REFUSED" : softFails.length > 0 ? "PENDING" : "APPROVED";
              const colors = { APPROVED: "var(--green)", PENDING: "var(--orange)", REFUSED: "var(--red)" };
              const bgs = { APPROVED: "var(--green-bg)", PENDING: "var(--orange-bg)", REFUSED: "var(--red-bg)" };
              const borders = { APPROVED: "var(--green-border)", PENDING: "var(--orange-border)", REFUSED: "var(--red-border)" };
              const icons = { APPROVED: "🤖✅", PENDING: "🤖⏳", REFUSED: "🤖❌" };
              const msgs = {
                APPROVED: isEval ? "Toutes les règles d'évaluation validées. Prêt à passer funded." : "Toutes les vérifications payout passées.",
                PENDING: softFails.map(c => c.label).join(", ") + " — conditions non remplies.",
                REFUSED: blockingFails.map(c => c.label).join(", ") + " — violation bloquante.",
              };
              return (
                <div style={{ padding: "12px 16px", background: bgs[verdict], border: `1px solid ${borders[verdict]}`, borderRadius: 2, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{icons[verdict]}</span>
                  <div>
                    <div className="verdict-label" style={{ fontSize: 14, fontWeight: 700, color: colors[verdict], letterSpacing: "0.06em" }}>VERDICT : {verdict}</div>
                    <div className="verdict-msg" style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>{msgs[verdict]}</div>
                    {scalpingFlag && <div style={{ ...MONO, fontSize: 10, color: "var(--orange)", marginTop: 4 }}>⚠ Micro-scalping {account.scalping}% &gt; 40% — à noter (informatif)</div>}
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setVerdict({ type: "APPROVED" })} style={{ flex: 1, padding: "11px", background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 2, color: "var(--green)", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em", transition: "all 0.2s" }}
                onMouseEnter={e => e.target.style.background = "rgba(52,211,153,0.15)"}
                onMouseLeave={e => e.target.style.background = "var(--green-bg)"}>
                ✓ VALIDATE & FUND
              </button>
              <button onClick={() => setModal(true)} style={{ flex: 1, padding: "11px", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 2, color: "var(--red)", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em" }}>
                ✕ REFUSE
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Reviews() {
  const [filter, setFilter] = useState("ALL");
  const pendingTraders = TRADERS.filter(t => t.accounts.some(a => a.status === "PENDING_REVIEW"));
  const filtered = filter === "ALL" ? pendingTraders : pendingTraders.filter(t => t.accounts.some(a => a.status === "PENDING_REVIEW" && a.type === filter));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "0.06em" }}>CHALLENGE REVIEWS</div>
          <div style={{ ...MONO, fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{TRADERS.flatMap(t => t.accounts.filter(a => a.status === "PENDING_REVIEW")).length} accounts pending</div>
        </div>
        <div style={{ flex: 1 }} />
        {["ALL", "CHALLENGE", "PRO"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...MONO, fontSize: 11, padding: "6px 14px", borderRadius: 2, border: "1px solid var(--border)", background: filter === f ? "var(--gold-glow2)" : "var(--bg2)", color: filter === f ? "var(--gold)" : "var(--text2)" }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)", fontSize: 14 }}>No pending reviews for this filter.</div>
      ) : filtered.map(trader => (
        <div key={trader.id} className="fade-up" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>
              {trader.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{trader.name}</span>
              <span style={{ ...MONO, fontSize: 11, color: "var(--text3)", marginLeft: 10 }}>{trader.country}</span>
            </div>
            <Badge label={trader.kyc} />
            <span style={{ ...MONO, fontSize: 10, background: "var(--bg3)", color: "var(--text2)", padding: "2px 9px", borderRadius: 2, border: "1px solid var(--border)" }}>
              {trader.accounts.filter(a => a.status === "PENDING_REVIEW").length} account(s)
            </span>
          </div>
          {trader.accounts.filter(a => a.status === "PENDING_REVIEW").map(acc => (
            <ReviewCard key={acc.id} account={acc} trader={trader} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── PAYOUTS PAGE ─────────────────────────────────────────────────────────────
function PayoutCard({ payout, trader }) {
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const PAYOUT_CAPS_TABLE = {
    50000:  [1500, 2000, 2000, 2500, 2500, 3000],
    100000: [2000, 2500, 2500, 3000, 3000, 3500],
    150000: [2500, 3000, 3000, 3500, 3500, 4000],
  };
  const accountSize = trader.accounts.find(a => a.id === payout.account)?.size || 100000;
  const capRow = PAYOUT_CAPS_TABLE[accountSize] || PAYOUT_CAPS_TABLE[100000];
  const capBreakdown = capRow.map((cap, i) => ({ n: i + 1, cap }));
  const applicableCap = capRow[Math.min(payout.withdrawalNumber - 1, capRow.length - 1)];
  const capAmount = Math.min(payout.profitSinceLast * 0.9, applicableCap);

  const payoutSummaryChecks = [
    { label: "Profit since last", value: "$" + payout.profitSinceLast.toLocaleString(), ok: payout.profitSinceLast > 0 },
    { label: "Consistency", value: payout.consistency + "%", ok: payout.consistency >= 30 },
    { label: "Qualifying days", value: payout.qualifyingDays + " days", ok: payout.qualifyingDays >= 5 },
    { label: "Latent loss", value: payout.latentLoss ? "Detected" : "None", ok: !payout.latentLoss },
  ];

  return (
    <>
      {modal && <RefusalModal title={`Refuse payout — ${payout.account}`} onClose={() => setModal(false)} onConfirm={(r, n) => { setVerdict({ type: "REFUSED" }); setModal(false); }} />}
      <div style={{ background: "var(--bg2)", border: `1px solid ${verdict ? (verdict.type === "REFUSED" ? "var(--red-border)" : "var(--green-border)") : "var(--border)"}`, marginBottom: 8, overflow: "hidden", borderLeft: "2px solid var(--border2)" }}>
        <div onClick={() => !verdict && setExpanded(e => !e)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: verdict ? "default" : "pointer" }}>
          <span style={{ ...MONO, fontSize: 12, color: "var(--text2)" }}>{payout.account}</span>
          <span style={{ ...MONO, fontSize: 10, background: "var(--bg3)", color: "var(--text2)", padding: "2px 8px", borderRadius: 1, border: "1px solid var(--border)" }}>#{payout.withdrawalNumber}</span>
          <span style={{ ...MONO, fontSize: 14, color: "var(--green)", fontWeight: 400 }}>${capAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>of ${payout.profitSinceLast.toLocaleString()} profit</span>
          <div style={{ flex: 1 }} />
          {verdict ? <Badge label={verdict.type === "REFUSED" ? "REFUSED" : "PAID"} /> : (
            <span style={{ ...MONO, fontSize: 10, color: "var(--text3)" }}>{expanded ? "▲" : "▼"}</span>
          )}
        </div>
        {expanded && !verdict && (
          <div className="fade-up" style={{ padding: "0 18px 18px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 14, marginBottom: 16 }}>
              {payoutSummaryChecks.map(({ label, value, ok }) => (
                <div key={label} style={{ background: ok ? "var(--green-bg)" : "var(--red-bg)", border: `1px solid ${ok ? "var(--green-border)" : "var(--red-border)"}`, padding: "10px 12px" }}>
                  <div className="check-label" style={{ fontSize: 10, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                  <div className="check-value" style={{ ...MONO, fontSize: 15, color: ok ? "var(--green)" : "var(--red)" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Payout cap progression */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "var(--text2)" }}>Caps progressifs — {(accountSize/1000).toFixed(0)}K</span>
                <span style={{ ...MONO, fontSize: 10, color: "var(--gold)" }}>Applicable : ${applicableCap.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {capBreakdown.map(({ n, cap }) => (
                  <div key={n} style={{ flex: 1, padding: "7px 5px", borderRadius: 1, textAlign: "center", background: n === payout.withdrawalNumber ? "var(--gold-glow2)" : "var(--bg3)", border: `1px solid ${n === payout.withdrawalNumber ? "var(--gold)" : "var(--border)"}` }}>
                    <div style={{ ...MONO, fontSize: 8, color: n === payout.withdrawalNumber ? "var(--gold)" : "var(--text3)" }}>#{n}{n === 6 ? "+" : ""}</div>
                    <div style={{ ...MONO, fontSize: 10, color: n === payout.withdrawalNumber ? "var(--gold)" : "var(--text2)", marginTop: 2 }}>${(cap/1000).toFixed(1)}k</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...MONO, fontSize: 12, padding: "11px 14px", background: "var(--bg3)", borderRadius: 2, marginBottom: 14, color: "var(--text2)", border: "1px solid var(--border)" }}>
              Net payout : <span style={{ color: "var(--green)", fontSize: 14 }}>${capAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span style={{ color: "var(--text3)" }}> = MIN(${ payout.profitSinceLast.toLocaleString()} × 90%, cap ${applicableCap.toLocaleString()}) — Retrait #{payout.withdrawalNumber}</span>
              {payout.profitSinceLast < 500 && <span style={{ color: "var(--red)", display: "block", marginTop: 4 }}>⚠ En dessous du minimum $500</span>}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setVerdict({ type: "APPROVED" })} style={{ flex: 1, padding: "11px", background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 2, color: "var(--green)", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em" }}>
                ✓ APPROUVER ${capAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </button>
              <button onClick={() => setModal(true)} style={{ flex: 1, padding: "11px", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 2, color: "var(--red)", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em" }}>
                ✕ REFUSE
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Payouts() {
  const pending = TRADERS.filter(t => t.pendingPayout);
  const history = TRADERS.flatMap(t => t.payouts.map(p => ({ ...p, traderName: t.name }))).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "0.06em" }}>PAYOUT MANAGEMENT</div>
        <div style={{ ...MONO, fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{pending.length} pending · ${history.filter(p => p.status === "PAID").reduce((a, p) => a + p.amount, 0).toLocaleString()} total paid out</div>
      </div>

      {/* Pending */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", marginBottom: 14, textTransform: "uppercase" }}>Pending Requests</div>
        {pending.length === 0 ? (
          <div style={{ color: "var(--text3)", fontSize: 13, padding: "20px 0" }}>No pending payout requests.</div>
        ) : pending.map(trader => (
          <div key={trader.id} className="fade-up" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--gold)" }}>
                {trader.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{trader.name}</span>
                <span style={{ ...MONO, fontSize: 11, color: "var(--text3)", marginLeft: 10 }}>{trader.country}</span>
              </div>
            </div>
            <PayoutCard payout={trader.pendingPayout} trader={trader} />
          </div>
        ))}
      </div>

      {/* History */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", marginBottom: 14, textTransform: "uppercase" }}>Payout History</div>
        <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <table style={{ width: "100%" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["ID", "Trader", "Account", "Date", "Amount", "Withdrawal #", "Status"].map(h => (
                  <th key={h} style={{ ...MONO, fontSize: 9, color: "var(--text3)", padding: "11px 16px", textAlign: "left", letterSpacing: "0.07em", fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((p, i) => (
                <tr key={p.id} className="hover-row" style={{ borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.1s" }}>
                  <td style={{ ...MONO, fontSize: 11, color: "var(--text3)", padding: "12px 16px" }}>{p.id}</td>
                  <td style={{ fontSize: 12, fontWeight: 500, padding: "12px 16px" }}>{p.traderName}</td>
                  <td style={{ ...MONO, fontSize: 11, color: "var(--text2)", padding: "12px 16px" }}>{p.account}</td>
                  <td style={{ ...MONO, fontSize: 11, color: "var(--text3)", padding: "12px 16px" }}>{p.date}</td>
                  <td style={{ ...MONO, fontSize: 12, color: "var(--green)", padding: "12px 16px" }}>${p.amount.toLocaleString()}</td>
                  <td style={{ ...MONO, fontSize: 11, color: "var(--text2)", padding: "12px 16px" }}>#{p.withdrawal}</td>
                  <td style={{ padding: "12px 16px" }}><Badge label={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TRADERS PAGE ─────────────────────────────────────────────────────────────
function TraderProfile({ trader, onBack }) {
  const [tab, setTab] = useState("accounts");
  const totalWithdrawn = trader.totalWithdrawn;
  const funded = trader.accounts.filter(a => a.status === "FUNDED").length;

  return (
    <div className="fade-in">
      <button onClick={onBack} style={{ ...MONO, fontSize: 11, color: "var(--text3)", background: "none", border: "none", marginBottom: 20, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
        ← Back to Traders
      </button>

      {/* Profile header */}
      <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 2, padding: "24px 28px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 48, height: 48, background: "var(--bg3)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "var(--gold)", flexShrink: 0 }}>
          {trader.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{trader.name}</span>
            <Badge label={trader.kyc} />
            {trader.pendingPayout && <Badge label="PENDING_REVIEW" />}
          </div>
          <div style={{ ...MONO, fontSize: 12, color: "var(--text3)" }}>{trader.email} · {trader.country}</div>
          <div style={{ ...MONO, fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Joined {trader.joined} · Affiliate: {trader.affiliate} · ID: {trader.id}</div>
        </div>
        <div style={{ display: "flex", gap: 16, textAlign: "center" }}>
          {[
            { label: "Accounts", val: trader.accounts.length },
            { label: "Funded", val: funded },
            { label: "Withdrawn", val: "$" + totalWithdrawn.toLocaleString() },
            { label: "Payouts", val: trader.payouts.length },
          ].map(({ label, val }) => (
            <div key={label} style={{ padding: "8px 16px", background: "var(--bg2)", borderRadius: 2, border: "1px solid var(--border)" }}>
              <div style={{ ...MONO, fontSize: 16, color: "var(--gold)" }}>{val}</div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3, letterSpacing: "0.05em" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--bg2)", padding: 4, borderRadius: 2, width: "fit-content", border: "1px solid var(--border)" }}>
        {[["accounts", "Accounts"], ["payouts", "Payout History"], ["activity", "Activity Log"], ["notes", "Notes"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "8px 18px", borderRadius: 2, border: "none", background: tab === id ? "var(--bg4)" : "transparent", color: tab === id ? "var(--text)" : "var(--text3)", fontSize: 12, fontWeight: tab === id ? 600 : 400, transition: "all 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Accounts */}
      {tab === "accounts" && (
        <div className="fade-in" style={{ background: "var(--bg1)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <table style={{ width: "100%" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Account ID", "Type", "Size", "Status", "P&L", "Target", "Days", "Consistency", "Drawdown $", "Scalping", "Purchased"].map(h => (
                  <th key={h} style={{ ...MONO, fontSize: 9, color: "var(--text3)", padding: "11px 14px", textAlign: "left", letterSpacing: "0.06em", fontWeight: 400, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trader.accounts.map((a, i) => (
                <tr key={a.id} className="hover-row" style={{ borderBottom: i < trader.accounts.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td style={{ ...MONO, fontSize: 11, color: "var(--text2)", padding: "12px 14px" }}>{a.id}</td>
                  <td style={{ padding: "12px 14px" }}><Badge label={a.type} /></td>
                  <td style={{ ...MONO, fontSize: 11, color: "var(--gold)", padding: "12px 14px" }}>${a.size.toLocaleString()}</td>
                  <td style={{ padding: "12px 14px" }}><Badge label={a.status} /></td>
                  <td style={{ ...MONO, fontSize: 11, color: a.profit >= 0 ? "var(--green)" : "var(--red)", padding: "12px 14px" }}>${a.profit.toLocaleString()}</td>
                  <td style={{ ...MONO, fontSize: 11, color: a.profitTarget ? (a.profit >= a.profitTarget ? "var(--green)" : "var(--orange)") : "var(--text3)", padding: "12px 14px" }}>{a.profitTarget ? "$" + a.profitTarget.toLocaleString() : "—"}</td>
                  <td style={{ ...MONO, fontSize: 11, color: a.days >= 5 ? "var(--green)" : "var(--red)", padding: "12px 14px" }}>{a.days}</td>
                  <td style={{ padding: "12px 14px", minWidth: 100 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ ...MONO, fontSize: 11, color: a.consistency >= 30 ? "var(--green)" : "var(--red)", minWidth: 34 }}>{a.consistency}%</span>
                      <div style={{ flex: 1 }}><ProgressBar value={a.consistency} max={100} color="var(--green)" height={3} /></div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", minWidth: 120 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ ...MONO, fontSize: 10, color: a.currentDrawdown <= a.maxDrawdown ? "var(--green)" : "var(--red)", minWidth: 50 }}>${a.currentDrawdown.toLocaleString()}</span>
                      <div style={{ flex: 1 }}><ProgressBar value={a.currentDrawdown} max={a.maxDrawdown} color={a.currentDrawdown > a.maxDrawdown * 0.75 ? "var(--orange)" : "var(--green)"} height={3} /></div>
                      <span style={{ ...MONO, fontSize: 9, color: "var(--text3)" }}>/${a.maxDrawdown.toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={{ ...MONO, fontSize: 11, color: a.scalping <= 40 ? "var(--text2)" : "var(--red)", padding: "12px 14px" }}>{a.scalping}%</td>
                  <td style={{ ...MONO, fontSize: 11, color: "var(--text3)", padding: "12px 14px", whiteSpace: "nowrap" }}>{a.purchaseDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Payouts */}
      {tab === "payouts" && (
        <div className="fade-in">
          {trader.payouts.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: 13, padding: "20px 0" }}>No payouts recorded.</div>
          ) : (
            <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", overflow: "hidden" }}>
              <table style={{ width: "100%" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["ID", "Date", "Account", "Amount", "Withdrawal #", "Status"].map(h => (
                      <th key={h} style={{ ...MONO, fontSize: 9, color: "var(--text3)", padding: "11px 16px", textAlign: "left", letterSpacing: "0.07em", fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trader.payouts.map((p, i) => (
                    <tr key={p.id} className="hover-row" style={{ borderBottom: i < trader.payouts.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <td style={{ ...MONO, fontSize: 11, color: "var(--text3)", padding: "12px 16px" }}>{p.id}</td>
                      <td style={{ ...MONO, fontSize: 11, color: "var(--text2)", padding: "12px 16px" }}>{p.date}</td>
                      <td style={{ ...MONO, fontSize: 11, color: "var(--text2)", padding: "12px 16px" }}>{p.account}</td>
                      <td style={{ ...MONO, fontSize: 12, color: "var(--green)", padding: "12px 16px" }}>${p.amount.toLocaleString()}</td>
                      <td style={{ ...MONO, fontSize: 11, color: "var(--text2)", padding: "12px 16px" }}>#{p.withdrawal}</td>
                      <td style={{ padding: "12px 16px" }}><Badge label={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Activity */}
      {tab === "activity" && (
        <div className="fade-in" style={{ background: "var(--bg1)", border: "1px solid var(--border)", padding: "20px 24px" }}>
          {trader.activity.length === 0 ? <div style={{ color: "var(--text3)", fontSize: 13 }}>No activity.</div> : trader.activity.map((a, i) => {
            const icons = { PAYOUT_REQUEST: "💰", PAYOUT_PAID: "✅", FLAG: "🚩", FAILED: "❌", SIGNUP: "👤", PURCHASE: "🛒" };
            return (
              <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 14, marginBottom: 14, borderBottom: i < trader.activity.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>{icons[a.type] || "•"}</span>
                  {i < trader.activity.length - 1 && <div style={{ flex: 1, width: 1, background: "var(--border)", marginTop: 8 }} />}
                </div>
                <div>
                  <div style={{ fontSize: 13 }}>{a.note}</div>
                  <div style={{ ...MONO, fontSize: 10, color: "var(--text3)", marginTop: 4 }}>{a.date}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Notes */}
      {tab === "notes" && (
        <div className="fade-in">
          <textarea defaultValue={trader.notes} style={{ width: "100%", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 2, padding: "16px 20px", color: "var(--text)", fontSize: 13, minHeight: 200, outline: "none", resize: "vertical" }} />
          <button style={{ marginTop: 10, padding: "10px 22px", background: "linear-gradient(135deg, var(--gold), var(--gold2))", border: "none", borderRadius: 2, color: "#000", fontWeight: 700, fontSize: 13 }}>Save Notes</button>
        </div>
      )}
    </div>
  );
}

// ─── KYC TOGGLE ───────────────────────────────────────────────────────────────
const KYC_STATES = ["NOT_DONE", "PENDING", "VERIFIED"];
const KYC_CONFIG = {
  NOT_DONE: { label: "Not done", color: "var(--text3)", bg: "var(--bg3)", border: "var(--border)", icon: "○" },
  PENDING:  { label: "Pending",  color: "var(--orange)", bg: "var(--orange-bg)", border: "var(--orange-border)", icon: "◐" },
  VERIFIED: { label: "Verified", color: "var(--green)",  bg: "var(--green-bg)",  border: "var(--green-border)",  icon: "●" },
};

function KycToggle({ value, onChange }) {
  const cfg = KYC_CONFIG[value] || KYC_CONFIG.NOT_DONE;
  const next = () => {
    const idx = KYC_STATES.indexOf(value);
    onChange(KYC_STATES[(idx + 1) % KYC_STATES.length]);
  };
  return (
    <button onClick={e => { e.stopPropagation(); next(); }} title="Click to cycle KYC status" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 1, cursor: "pointer",
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, transition: "all 0.15s",
      fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.06em",
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 12 }}>{cfg.icon}</span>
      {cfg.label}
    </button>
  );
}

function TradersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState("withdrawn");
  const [selected, setSelected] = useState(null);
  const [kycStates, setKycStates] = useState(() =>
    Object.fromEntries(TRADERS.map(t => [t.id, t.kyc === "VERIFIED" ? "VERIFIED" : t.kyc === "PENDING" ? "PENDING" : "NOT_DONE"]))
  );
  const setKyc = (traderId, val) => setKycStates(s => ({ ...s, [traderId]: val }));

  if (selected) return <TraderProfile trader={selected} onBack={() => setSelected(null)} />;

  let list = TRADERS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );
  if (filter === "FUNDED") list = list.filter(t => t.accounts.some(a => a.status === "FUNDED"));
  if (filter === "PENDING") list = list.filter(t => t.accounts.some(a => a.status === "PENDING_REVIEW") || t.pendingPayout);
  if (filter === "KYC_PENDING") list = list.filter(t => kycStates[t.id] !== "VERIFIED");
  if (sort === "withdrawn") list = [...list].sort((a, b) => b.totalWithdrawn - a.totalWithdrawn);
  if (sort === "joined") list = [...list].sort((a, b) => new Date(b.joined) - new Date(a.joined));
  if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "0.06em" }}>TRADERS</div>
          <div style={{ ...MONO, fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{TRADERS.length} registered · {TRADERS.filter(t => t.accounts.some(a => a.status === "FUNDED")).length} funded · {Object.values(kycStates).filter(v => v !== "VERIFIED").length} KYC pending</div>
        </div>
        <div style={{ flex: 1 }} />
        <input placeholder="Search name, email, ID…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 2, padding: "8px 14px", color: "var(--text)", fontSize: 12, outline: "none", width: 220, ...MONO }} />
        {["ALL", "FUNDED", "PENDING", "KYC PENDING"].map(f => (
          <button key={f} onClick={() => setFilter(f === "KYC PENDING" ? "KYC_PENDING" : f)} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: "6px 12px", borderRadius: 2, border: "1px solid var(--border)", background: filter === (f === "KYC PENDING" ? "KYC_PENDING" : f) ? "var(--gold-glow2)" : "var(--bg2)", color: filter === (f === "KYC PENDING" ? "KYC_PENDING" : f) ? "var(--gold)" : "var(--text2)", whiteSpace: "nowrap" }}>{f}</button>
        ))}
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 2, padding: "7px 12px", color: "var(--text2)", fontSize: 12, outline: "none", ...MONO }}>
          <option value="withdrawn">Sort: Withdrawn</option>
          <option value="joined">Sort: Joined</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ ...MONO, fontSize: 9, color: "var(--text3)", marginBottom: 8 }}>
          KYC — cliquez sur le statut pour le changer : ○ Not done → ◐ Pending → ● Verified
        </div>
      </div>
      <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", overflow: "auto" }}>
        <table style={{ width: "100%", minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Trader", "Country", "KYC", "Programmes", "Retraits", "Total Retiré", "Affiliate", "Joined", ""].map(h => (
                <th key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--text3)", padding: "11px 14px", textAlign: "left", letterSpacing: "0.07em", fontWeight: 400, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((trader, i) => {
              const hasPending = trader.accounts.some(a => a.status === "PENDING_REVIEW") || !!trader.pendingPayout;
              const types = [...new Set(trader.accounts.map(a => a.type))];
              const maxWithdrawal = trader.payouts.length > 0 ? Math.max(...trader.payouts.map(p => p.withdrawal)) : 0;
              const pendingWithdrawal = trader.pendingPayout ? trader.pendingPayout.withdrawalNumber : null;
              return (
                <tr key={trader.id} onClick={() => setSelected(trader)} className="hover-row"
                  style={{ borderBottom: i < list.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer" }}>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--gold)", flexShrink: 0 }}>
                        {trader.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{trader.name}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--text3)" }}>{trader.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text2)", padding: "13px 14px", whiteSpace: "nowrap" }}>{trader.country}</td>
                  <td style={{ padding: "13px 14px" }} onClick={e => e.stopPropagation()}>
                    <KycToggle value={kycStates[trader.id]} onChange={val => setKyc(trader.id, val)} />
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {types.map(type => {
                        const count = trader.accounts.filter(a => a.type === type).length;
                        return (
                          <span key={type} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <Badge label={type} />
                            {count > 1 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--text3)" }}>×{count}</span>}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    {maxWithdrawal === 0 && !pendingWithdrawal ? (
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text3)" }}>—</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {maxWithdrawal > 0 && (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--green)", background: "var(--green-bg)", border: "1px solid var(--green-border)", padding: "2px 8px", borderRadius: 1, whiteSpace: "nowrap" }}>
                            ✓ Retrait #{maxWithdrawal}
                          </span>
                        )}
                        {pendingWithdrawal && (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--orange)", background: "var(--orange-bg)", border: "1px solid var(--orange-border)", padding: "2px 8px", borderRadius: 1, whiteSpace: "nowrap" }}>
                            ⏳ #{pendingWithdrawal} en cours
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: trader.totalWithdrawn > 0 ? "var(--gold)" : "var(--text3)", padding: "13px 14px", whiteSpace: "nowrap" }}>
                    {trader.totalWithdrawn > 0 ? "$" + trader.totalWithdrawn.toLocaleString() : "—"}
                  </td>
                  <td style={{ fontSize: 11, color: "var(--text3)", padding: "13px 14px", whiteSpace: "nowrap" }}>{trader.affiliate}</td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text3)", padding: "13px 14px", whiteSpace: "nowrap" }}>{trader.joined}</td>
                  <td style={{ padding: "13px 14px" }}>
                    {hasPending
                      ? <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--orange)" }}>⚠ Pending</span>
                      : <span style={{ color: "var(--text3)", fontSize: 13 }}>→</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RISK MONITOR ─────────────────────────────────────────────────────────────
function RiskMonitor() {
  const allAccounts = TRADERS.flatMap(t =>
    t.accounts.map(a => ({ ...a, trader: t.name, traderId: t.id }))
  );

  const highRisk = allAccounts.filter(a => a.currentDrawdown > a.maxDrawdown * 0.7 || a.scalping > 35 || a.flipping || a.fraud);
  const avgConsistency = Math.round(allAccounts.reduce((s, a) => s + a.consistency, 0) / allAccounts.length);
  const avgDrawdown = (allAccounts.reduce((s, a) => s + a.drawdown, 0) / allAccounts.length).toFixed(1);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "0.06em" }}>RISK MONITOR</div>
        <div style={{ ...MONO, fontSize: 11, color: "var(--text3)", marginTop: 2 }}>Real-time rule compliance overview</div>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { label: "High Risk Accounts", value: highRisk.length, color: "var(--red)" },
          { label: "Avg Consistency", value: avgConsistency + "%", color: avgConsistency >= 60 ? "var(--green)" : "var(--orange)" },
          { label: "Avg Drawdown", value: avgDrawdown + "%", color: parseFloat(avgDrawdown) < 3 ? "var(--green)" : "var(--orange)" },
          { label: "Accounts Monitored", value: allAccounts.length, color: "var(--text)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, background: "var(--bg1)", border: "1px solid var(--border)", padding: "18px 20px" }}>
            <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
            <div style={{ ...MONO, fontSize: 26, color, fontWeight: 300 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Risk flags */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", marginBottom: 14, textTransform: "uppercase" }}>⚠ Flagged Accounts</div>
        {highRisk.length === 0 ? (
          <div style={{ color: "var(--green)", fontSize: 13, padding: "16px", background: "var(--green-bg)", borderRadius: 2, border: "1px solid var(--green-border)" }}>✓ No accounts flagged. All rules within bounds.</div>
        ) : highRisk.map(a => (
          <div key={a.id} style={{ background: "var(--bg1)", border: "1px solid var(--red-border)", marginBottom: 8, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 18 }}>🚩</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{a.trader}</span>
                <Badge label={a.type} />
                <span style={{ ...MONO, fontSize: 11, color: "var(--text3)" }}>{a.id}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {a.currentDrawdown > a.maxDrawdown * 0.7 && <span style={{ ...MONO, fontSize: 10, color: "var(--orange)", background: "var(--orange-bg)", padding: "2px 8px", borderRadius: 1, border: "1px solid var(--orange-border)" }}>Drawdown ${a.currentDrawdown.toLocaleString()} / ${a.maxDrawdown.toLocaleString()}</span>}
                {a.scalping > 35 && <span style={{ ...MONO, fontSize: 10, color: "var(--red)", background: "var(--red-bg)", padding: "2px 8px", borderRadius: 1, border: "1px solid var(--red-border)" }}>Scalping {a.scalping}%</span>}
                {a.flipping && <span style={{ ...MONO, fontSize: 10, color: "var(--red)", background: "var(--red-bg)", padding: "2px 8px", borderRadius: 1, border: "1px solid var(--red-border)" }}>Flipping detected</span>}
                {a.fraud && <span style={{ ...MONO, fontSize: 10, color: "var(--red)", background: "var(--red-bg)", padding: "2px 8px", borderRadius: 1, border: "1px solid var(--red-border)" }}>Fraud flag</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", marginBottom: 14, textTransform: "uppercase" }}>All Accounts — Rule Compliance</div>
        <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", overflow: "auto" }}>
          <table style={{ width: "100%", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Account", "Trader", "Type", "Drawdown", "Consistency", "Scalping", "Flipping", "Fraud", "Status"].map(h => (
                  <th key={h} style={{ ...MONO, fontSize: 9, color: "var(--text3)", padding: "11px 14px", textAlign: "left", letterSpacing: "0.07em", fontWeight: 400, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allAccounts.map((a, i) => (
                <tr key={a.id} className="hover-row" style={{ borderBottom: i < allAccounts.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td style={{ ...MONO, fontSize: 11, color: "var(--text2)", padding: "11px 14px" }}>{a.id}</td>
                  <td style={{ fontSize: 12, padding: "11px 14px" }}>{a.trader}</td>
                  <td style={{ padding: "11px 14px" }}><Badge label={a.type} /></td>
                  <td style={{ padding: "11px 14px", minWidth: 130 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ ...MONO, fontSize: 10, color: a.currentDrawdown > a.maxDrawdown * 0.8 ? "var(--red)" : "var(--green)", minWidth: 44 }}>${a.currentDrawdown.toLocaleString()}</span>
                      <div style={{ flex: 1 }}><ProgressBar value={a.currentDrawdown} max={a.maxDrawdown} color={a.currentDrawdown > a.maxDrawdown * 0.75 ? "var(--red)" : "var(--green)"} height={4} /></div>
                      <span style={{ ...MONO, fontSize: 9, color: "var(--text3)" }}>/${a.maxDrawdown.toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px", minWidth: 100 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ ...MONO, fontSize: 11, color: a.consistency >= 30 ? "var(--green)" : "var(--red)", minWidth: 34 }}>{a.consistency}%</span>
                      <div style={{ flex: 1 }}><ProgressBar value={a.consistency} max={100} color={a.consistency >= 30 ? "var(--green)" : "var(--red)"} height={4} /></div>
                    </div>
                  </td>
                  <td style={{ ...MONO, fontSize: 11, color: a.scalping > 40 ? "var(--red)" : a.scalping > 30 ? "var(--orange)" : "var(--text2)", padding: "11px 14px" }}>{a.scalping}%</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ ...MONO, fontSize: 10, color: a.flipping ? "var(--red)" : "var(--green)" }}>{a.flipping ? "⚠ YES" : "✓ NO"}</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ ...MONO, fontSize: 10, color: a.fraud ? "var(--red)" : "var(--green)" }}>{a.fraud ? "⚠ YES" : "✓ NO"}</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}><Badge label={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
// Rules stored per account size (50K/100K/150K)
const DEFAULT_RULES = {
  challenge_profit_50k: 3000, challenge_profit_100k: 6000, challenge_profit_150k: 9000,
  challenge_drawdown_50k: 2000, challenge_drawdown_100k: 3000, challenge_drawdown_150k: 4500,
  pro_profit_50k: 3000, pro_profit_100k: 6000, pro_profit_150k: 9000,
  pro_drawdown_50k: 2000, pro_drawdown_100k: 3000, pro_drawdown_150k: 4500,
  instant_drawdown_50k: 2000, instant_drawdown_100k: 3000, instant_drawdown_150k: 4500,
  instant_daily_50k: 1200, instant_daily_100k: 2250, instant_daily_150k: 3300,
  min_qualifying_days: 5, consistency_min: 30, max_scalping: 40,
  profit_split: 90, payout_frequency: 7,
};

const PAYOUT_CAPS_SETTINGS = {
  "50K":  [{ n:1, cap:1500 }, { n:2, cap:2000 }, { n:3, cap:2000 }, { n:4, cap:2500 }, { n:5, cap:2500 }, { n:"6+", cap:3000 }],
  "100K": [{ n:1, cap:2000 }, { n:2, cap:2500 }, { n:3, cap:2500 }, { n:4, cap:3000 }, { n:5, cap:3000 }, { n:"6+", cap:3500 }],
  "150K": [{ n:1, cap:2500 }, { n:2, cap:3000 }, { n:3, cap:3000 }, { n:4, cap:3500 }, { n:5, cap:3500 }, { n:"6+", cap:4000 }],
};

function Settings() {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [caps, setCaps] = useState(PAYOUT_CAPS);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("rules");

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const sections = [
    { title: "Challenge — Profit Targets", fields: [["challenge_profit_50k", "50K Profit Target", "USD"], ["challenge_profit_100k", "100K Profit Target", "USD"], ["challenge_profit_150k", "150K Profit Target", "USD"]] },
    { title: "Challenge / Pro — Max Drawdown", fields: [["challenge_drawdown_50k", "50K Max Drawdown", "USD"], ["challenge_drawdown_100k", "100K Max Drawdown", "USD"], ["challenge_drawdown_150k", "150K Max Drawdown", "USD"]] },
    { title: "Instant — Max Drawdown", fields: [["instant_drawdown_50k", "50K Max Drawdown", "USD"], ["instant_drawdown_100k", "100K Max Drawdown", "USD"], ["instant_drawdown_150k", "150K Max Drawdown", "USD"]] },
    { title: "Instant — Daily Loss Limit", fields: [["instant_daily_50k", "50K Daily Limit", "USD"], ["instant_daily_100k", "100K Daily Limit", "USD"], ["instant_daily_150k", "150K Daily Limit", "USD"]] },
    { title: "General Rules", fields: [["min_qualifying_days", "Min Qualifying Days", "days"], ["consistency_min", "Consistency Minimum", "%"], ["max_scalping", "Max Micro-scalping", "%"], ["profit_split", "Profit Split (Trader)", "%"], ["payout_frequency", "Payout Frequency", "days"]] },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "0.06em" }}>SETTINGS</div>
        <div style={{ ...MONO, fontSize: 11, color: "var(--text3)", marginTop: 2 }}>Program rules & configuration</div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--bg2)", padding: 4, borderRadius: 2, width: "fit-content", border: "1px solid var(--border)" }}>
        {[["rules", "Trading Rules"], ["caps", "Payout Caps"], ["instruments", "Instruments"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "8px 18px", borderRadius: 2, border: "none", background: tab === id ? "var(--bg4)" : "transparent", color: tab === id ? "var(--text)" : "var(--text3)", fontSize: 12, fontWeight: tab === id ? 600 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "rules" && (
        <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {sections.map(({ title, fields }) => (
            <div key={title} style={{ background: "var(--bg1)", border: "1px solid var(--border)", padding: "20px 22px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", marginBottom: 16, textTransform: "uppercase" }}>{title}</div>
              {fields.map(([key, label, unit]) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.06em", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ display: "flex", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 2, overflow: "hidden" }}>
                    <input type="number" value={rules[key]} onChange={e => setRules(r => ({ ...r, [key]: +e.target.value }))}
                      style={{ flex: 1, background: "transparent", border: "none", padding: "10px 14px", color: "var(--gold)", fontSize: 15, outline: "none", ...MONO }} />
                    <span style={{ ...MONO, fontSize: 11, color: "var(--text3)", padding: "0 14px", display: "flex", alignItems: "center", borderLeft: "1px solid var(--border2)" }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "caps" && (
        <div className="fade-in">
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", marginBottom: 16, textTransform: "uppercase" }}>Caps Progressifs par Taille de Compte</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {Object.entries(PAYOUT_CAPS_SETTINGS).map(([size, rows]) => (
              <div key={size} style={{ background: "var(--bg1)", border: "1px solid var(--border)", padding: "18px 20px" }}>
                <div style={{ ...MONO, fontSize: 11, color: "var(--gold)", marginBottom: 14, fontWeight: 600 }}>{size} — Min $500</div>
                {rows.map((c, i) => (
                  <div key={c.n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ ...MONO, fontSize: 10, color: "var(--text3)" }}>Retrait #{c.n}</div>
                    <div style={{ display: "flex", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 1, overflow: "hidden" }}>
                      <input type="number" defaultValue={c.cap}
                        style={{ width: 70, background: "transparent", border: "none", padding: "6px 10px", color: "var(--gold)", fontSize: 13, outline: "none", ...MONO, textAlign: "right" }} />
                      <span style={{ ...MONO, fontSize: 9, color: "var(--text3)", padding: "0 8px", display: "flex", alignItems: "center", borderLeft: "1px solid var(--border2)" }}>$</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "instruments" && (
        <div className="fade-in" style={{ background: "var(--bg1)", border: "1px solid var(--border)", padding: "24px 26px", maxWidth: 500 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", marginBottom: 16, textTransform: "uppercase" }}>Allowed Instruments</div>
          {[["NQ", "Nasdaq 100 Futures"], ["ES", "S&P 500 Futures"], ["YM", "Dow Jones Futures"], ["RTY", "Russell 2000 Futures"], ["GC", "Gold Futures"], ["CL", "Crude Oil Futures"], ["SI", "Silver Futures"], ["NG", "Natural Gas Futures"], ["BUND", "German Bund Futures"]].map(([sym, name]) => (
            <div key={sym} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 2, marginBottom: 6, background: "var(--bg2)", border: "1px solid var(--border)" }}>
              <input type="checkbox" defaultChecked style={{ accentColor: "var(--gold)", width: 14, height: 14 }} />
              <span style={{ ...MONO, fontSize: 12, color: "var(--gold)", minWidth: 50 }}>{sym}</span>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>{name}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={save} style={{
        marginTop: 24, padding: "12px 32px",
        background: saved ? "var(--green)" : "linear-gradient(135deg, var(--gold), var(--gold2))",
        border: "none", borderRadius: 2, color: "#000", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em",
        transition: "all 0.2s", boxShadow: saved ? "0 4px 20px rgba(52,211,153,0.3)" : "0 4px 20px rgba(201,168,76,0.25)"
      }}>
        {saved ? "✓ SAVED SUCCESSFULLY" : "SAVE ALL CHANGES"}
      </button>
    </div>
  );
}

// ─── MOBILE NAV ───────────────────────────────────────────────────────────────
const MOBILE_NAV = [
  { id: "overview", label: "Overview", icon: "◈" },
  { id: "reviews", label: "Reviews", icon: "◉" },
  { id: "payouts", label: "Payouts", icon: "◎" },
  { id: "traders", label: "Traders", icon: "◷" },
  { id: "risk", label: "Risk", icon: "◬" },
  { id: "settings", label: "Settings", icon: "⊕" },
];

function MobileBottomNav({ page, setPage }) {
  const pendingReviews = TRADERS.flatMap(t => t.accounts.filter(a => a.status === "PENDING_REVIEW")).length;
  const pendingPayouts = TRADERS.filter(t => t.pendingPayout).length;
  const badges = { reviews: pendingReviews, payouts: pendingPayouts };

  return (
    <div className="mobile-nav" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
      background: "var(--bg0)", borderTop: "1px solid var(--border)",
      flexDirection: "row", alignItems: "stretch",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {MOBILE_NAV.map(n => {
        const active = page === n.id;
        const badge = badges[n.id];
        return (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 3, padding: "10px 4px 8px",
            background: "transparent", border: "none",
            borderTop: active ? "2px solid var(--gold)" : "2px solid transparent",
            color: active ? "var(--gold)" : "var(--text3)",
            position: "relative", transition: "all 0.12s",
          }}>
            <span style={{ fontSize: 14 }}>{n.icon}</span>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 9, letterSpacing: "0.08em",
              color: active ? "var(--gold)" : "var(--text3)",
            }}>{n.label.toUpperCase()}</span>
            {badge > 0 && (
              <span style={{
                position: "absolute", top: 6, right: "50%", transform: "translateX(6px)",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 8, background: "var(--gold)", color: "#000",
                borderRadius: "50%", width: 14, height: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700,
              }}>{badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  overview: "Overview", reviews: "Challenge Reviews",
  payouts: "Payout Management", traders: "Traders",
  risk: "Risk Monitor", settings: "Settings",
};

export default function App() {
  const [auth, setAuth] = useState(false);
  const [page, setPage] = useState("overview");

  if (!auth) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Login onLogin={() => setAuth(true)} />
    </>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", background: "var(--bg0)", minHeight: "100vh" }}>
        <Sidebar page={page} setPage={setPage} />
        <div className="main-content" style={{ marginLeft: 210, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Topbar pageTitle={PAGE_TITLES[page]} onLogout={() => setAuth(false)} setPage={setPage} />
          <main style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
            <div key={page} className="page-enter">
              {page === "overview" && <Overview setPage={setPage} />}
              {page === "reviews" && <Reviews />}
              {page === "payouts" && <Payouts />}
              {page === "traders" && <TradersPage />}
              {page === "risk" && <RiskMonitor />}
              {page === "settings" && <Settings />}
            </div>
          </main>
        </div>
      </div>
      <MobileBottomNav page={page} setPage={setPage} />
    </>
  );
}
