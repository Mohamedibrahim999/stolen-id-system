import { useState, useEffect, createContext, useContext, useCallback } from "react";

// ─── Axios-like fetch wrapper ────────────────────────────────────────────────
const BASE_URL = "http://127.0.0.1:8000";

const api = {
  async request(method, path, { body, token } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, message: data.detail || data.message || "Request failed" };
    return data;
  },
  post: (path, body, token) => api.request("POST", path, { body, token }),
  get: (path, token) => api.request("GET", path, { token }),
};

// ─── Auth Context ────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("sid_token"));
  const [role, setRole] = useState(() => localStorage.getItem("sid_role"));
  const [username, setUsername] = useState(() => localStorage.getItem("sid_user"));

  const login = (tok, rl, user) => {
    setToken(tok); setRole(rl); setUsername(user);
    localStorage.setItem("sid_token", tok);
    localStorage.setItem("sid_role", rl);
    localStorage.setItem("sid_user", user);
  };
  const logout = () => {
    setToken(null); setRole(null); setUsername(null);
    localStorage.removeItem("sid_token");
    localStorage.removeItem("sid_role");
    localStorage.removeItem("sid_user");
  };

  return (
    <AuthCtx.Provider value={{ token, role, username, login, logout, isAdmin: role === "admin" }}>
      {children}
    </AuthCtx.Provider>
  );
}

// ─── Design Tokens ───────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow:wght@300;400;500;600;700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-base:     #060b14;
    --bg-surface:  #0b1526;
    --bg-card:     #0f1e36;
    --bg-hover:    #162847;
    --border:      #1e3a5f;
    --border-glow: #2463a4;
    --accent:      #1d6bde;
    --accent-dim:  #1450a8;
    --accent-glow: rgba(29,107,222,0.25);
    --red:         #e63946;
    --red-dim:     #b52d38;
    --red-glow:    rgba(230,57,70,0.2);
    --green:       #2dc653;
    --green-dim:   #1e9b3e;
    --green-glow:  rgba(45,198,83,0.2);
    --amber:       #f4a261;
    --text-primary:   #e8f0fb;
    --text-secondary: #7b9abf;
    --text-muted:     #3d5a80;
    --font-mono: 'Share Tech Mono', monospace;
    --font-sans: 'Barlow', sans-serif;
  }

  html, body, #root { height: 100%; background: var(--bg-base); color: var(--text-primary); font-family: var(--font-sans); }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg-base); }
  ::-webkit-scrollbar-thumb { background: var(--border-glow); border-radius: 2px; }

  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100%{opacity:1;} 50%{opacity:.4;} }
  @keyframes scanline { 0%{transform:translateY(-100%);} 100%{transform:translateY(100vh);} }
  @keyframes glow { 0%,100%{box-shadow:0 0 8px var(--accent-glow);} 50%{box-shadow:0 0 20px var(--accent-glow);} }
  @keyframes spin { to{transform:rotate(360deg);} }

  .page-enter { animation: fadeIn 0.35s ease forwards; }

  .scanline-overlay {
    pointer-events:none; position:fixed; inset:0; z-index:9999;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px);
  }
`;

// ─── Reusable Components ─────────────────────────────────────────────────────

function Spinner({ size = 18 }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid var(--border)`,
      borderTopColor: "var(--accent)", borderRadius: "50%",
      animation: "spin 0.7s linear infinite", display: "inline-block"
    }} />
  );
}

function Alert({ type = "error", msg, onClose }) {
  if (!msg) return null;
  const colors = {
    error:   { bg: "var(--red-glow)",   border: "var(--red)",   icon: "⚠" },
    success: { bg: "var(--green-glow)", border: "var(--green)", icon: "✔" },
    info:    { bg: "var(--accent-glow)",border: "var(--accent)","icon": "ℹ" },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6,
      padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center",
      gap: 10, fontSize: 13, fontFamily: "var(--font-mono)", animation: "fadeIn .2s ease"
    }}>
      <span style={{ color: c.border, fontSize: 16 }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      {onClose && <span onClick={onClose} style={{ cursor: "pointer", opacity: .6, fontSize: 16 }}>×</span>}
    </div>
  );
}

function Input({ label, id, error, icon, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label htmlFor={id} style={{
          display: "block", marginBottom: 6, fontSize: 11, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600
        }}>{label}</label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", fontSize: 14, pointerEvents: "none"
          }}>{icon}</span>
        )}
        <input
          id={id}
          style={{
            width: "100%", padding: icon ? "10px 12px 10px 36px" : "10px 12px",
            background: "var(--bg-base)", border: `1px solid ${error ? "var(--red)" : "var(--border)"}`,
            borderRadius: 6, color: "var(--text-primary)", fontFamily: "var(--font-mono)",
            fontSize: 13, outline: "none", transition: "border-color .2s, box-shadow .2s",
          }}
          onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 2px var(--accent-glow)"; }}
          onBlur={e => { e.target.style.borderColor = error ? "var(--red)" : "var(--border)"; e.target.style.boxShadow = "none"; }}
          {...props}
        />
      </div>
      {error && <p style={{ color: "var(--red)", fontSize: 11, marginTop: 4, fontFamily: "var(--font-mono)" }}>{error}</p>}
    </div>
  );
}

function Button({ children, variant = "primary", loading, fullWidth, small, ...props }) {
  const variants = {
    primary:  { bg: "var(--accent)",      color: "#fff",                 border: "transparent",    hover: "var(--accent-dim)" },
    danger:   { bg: "var(--red)",         color: "#fff",                 border: "transparent",    hover: "var(--red-dim)" },
    ghost:    { bg: "transparent",        color: "var(--text-secondary)", border: "var(--border)", hover: "var(--bg-hover)" },
    success:  { bg: "var(--green)",       color: "#fff",                 border: "transparent",    hover: "var(--green-dim)" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      disabled={loading || props.disabled}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: small ? "6px 14px" : "10px 22px",
        background: v.bg, color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: 6, cursor: loading ? "not-allowed" : "pointer",
        fontSize: small ? 12 : 13, fontWeight: 600, letterSpacing: "0.06em",
        textTransform: "uppercase", fontFamily: "var(--font-sans)",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        opacity: (loading || props.disabled) ? .6 : 1,
        transition: "background .2s, transform .1s",
      }}
      onMouseEnter={e => { if (!loading && !props.disabled) e.currentTarget.style.background = v.hover; }}
      onMouseLeave={e => { e.currentTarget.style.background = v.bg; }}
      onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
      {...props}
    >
      {loading ? <Spinner size={14} /> : null}
      {children}
    </button>
  );
}

function Card({ children, title, subtitle, badge, style: sx = {} }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "22px 24px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)", ...sx
    }}>
      {(title || badge) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: subtitle ? 4 : 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-primary)" }}>{title}</h3>
          {badge}
        </div>
      )}
      {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18, fontFamily: "var(--font-mono)" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Badge({ status }) {
  const map = {
    stolen: { color: "var(--red)",   bg: "var(--red-glow)",   label: "● STOLEN"  },
    clear:  { color: "var(--green)", bg: "var(--green-glow)", label: "● CLEAR"   },
    admin:  { color: "var(--amber)", bg: "rgba(244,162,97,.15)", label: "ADMIN"  },
    user:   { color: "var(--accent)",bg: "var(--accent-glow)", label: "USER"     },
  };
  const s = map[status?.toLowerCase()] || map.clear;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.color}`,
      padding: "2px 10px", borderRadius: 4, fontSize: 10,
      fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em"
    }}>{s.label}</span>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard",  label: "Dashboard",      icon: "▣" },
  { id: "report",     label: "Report ID",       icon: "⊕" },
  { id: "check",      label: "Check ID",        icon: "⊙" },
  { id: "admin",      label: "Admin Panel",     icon: "◈", adminOnly: true },
];

function Sidebar({ page, setPage }) {
  const { username, role, logout, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV.filter(n => !n.adminOnly || isAdmin);

  const SidebarContent = () => (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      padding: "0", background: "var(--bg-surface)",
      borderRight: "1px solid var(--border)"
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 20px 16px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10
      }}>
        <div style={{
          width: 36, height: 36, background: "var(--accent)", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 900, flexShrink: 0
        }}>⚖</div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>SID System</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>National ID Authority</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {navItems.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setMobileOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 20px", background: active ? "var(--bg-hover)" : "transparent",
                border: "none", color: active ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
                textAlign: "left", transition: "all .15s",
                borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                letterSpacing: "0.04em",
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.adminOnly && (
                <span style={{ marginLeft: "auto", fontSize: 9, background: "var(--amber)", color: "#000",
                  padding: "1px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: "0.05em" }}>ADMIN</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: "var(--accent-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, flexShrink: 0, color: "#fff"
          }}>{username?.[0]?.toUpperCase() || "U"}</div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, truncate: true, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{username}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Badge status={role} />
              </div>
            </div>
          )}
        </div>
        <Button variant="ghost" fullWidth small onClick={logout}>
          {collapsed ? "⏏" : "⏏  Sign Out"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div style={{
        width: collapsed ? 68 : 230, flexShrink: 0, height: "100vh",
        position: "sticky", top: 0, display: "none",
        transition: "width .2s",
        "@media(min-width:768px)": { display: "block" }
      }} className="desktop-sidebar">
        <SidebarContent />
      </div>

      {/* Mobile top bar */}
      <div style={{
        display: "none", position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "var(--bg-surface)", borderBottom: "1px solid var(--border)",
        padding: "12px 16px", alignItems: "center", justifyContent: "space-between"
      }} className="mobile-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "var(--accent)", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚖</div>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em" }}>SID SYSTEM</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{
          background: "none", border: "1px solid var(--border)", color: "var(--text-primary)",
          padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 16
        }}>☰</button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div onClick={() => setMobileOpen(false)} style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)"
          }} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 240 }}>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color = "var(--accent)" }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 16,
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      transition: "border-color .2s",
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = color}
    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      <div style={{
        width: 44, height: 44, background: `${color}22`, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "var(--font-mono)", color }}>{value}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function DashboardPage({ setPage }) {
  const { username, isAdmin } = useAuth();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ padding: "28px 32px", animation: "fadeIn .3s ease", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 4, letterSpacing: "0.1em" }}>
          {dateStr.toUpperCase()}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.01em" }}>
          Welcome back, <span style={{ color: "var(--accent)" }}>{username}</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 14 }}>
          Stolen Identity Reporting & Verification System — National ID Authority
        </p>
      </div>

      {/* Status bar */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
        padding: "10px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "pulse 2s infinite" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>
          SYSTEM OPERATIONAL — All services running normally — Uptime: 99.98%
        </span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
          NODE: EG-01 / CAIRO
        </span>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Reports" value="—" icon="📋" color="var(--accent)" />
        <StatCard label="Stolen IDs" value="—" icon="⚠" color="var(--red)" />
        <StatCard label="Clear IDs" value="—" icon="✔" color="var(--green)" />
        <StatCard label="Queries Today" value="—" icon="🔍" color="var(--amber)" />
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        <Card title="Report Stolen ID" subtitle="FILE A NEW NATIONAL ID THEFT REPORT">
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
            Submit a police report for a stolen or lost national identity document. Requires official police station reference.
          </p>
          <Button variant="danger" onClick={() => setPage("report")}>⊕ File Report</Button>
        </Card>

        <Card title="Verify National ID" subtitle="CHECK ID STATUS IN DATABASE">
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
            Instantly verify whether a national ID number has been reported as stolen or is clear in the national registry.
          </p>
          <Button onClick={() => setPage("check")}>⊙ Check ID</Button>
        </Card>

        {isAdmin && (
          <Card title="Admin Panel" subtitle="MANAGE ALL REPORTS">
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
              Access the full registry of stolen ID reports. Restricted to authorized personnel only.
            </p>
            <Button variant="ghost" onClick={() => setPage("admin")}>◈ Open Panel</Button>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
      }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
          SID SYSTEM v2.1 — MINISTRY OF INTERIOR — CLASSIFIED SYSTEM
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
          © {now.getFullYear()} National ID Authority. All rights reserved.
        </span>
      </div>
    </div>
  );
}

// ─── Report ID Page ───────────────────────────────────────────────────────────

function ReportPage() {
  const { token } = useAuth();
  const [form, setForm] = useState({ national_id: "", report_number: "", police_station: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.national_id.trim()) e.national_id = "National ID is required";
    else if (!/^\d{10,20}$/.test(form.national_id.trim())) e.national_id = "Must be 10–20 digits";
    if (!form.report_number.trim()) e.report_number = "Report number is required";
    if (!form.police_station.trim()) e.police_station = "Police station is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setAlert(null);
    try {
      await api.post("/report-id", form, token);
      setAlert({ type: "success", msg: `Report filed successfully. National ID ${form.national_id} marked as stolen.` });
      setForm({ national_id: "", report_number: "", police_station: "" });
    } catch (err) {
      setAlert({ type: "error", msg: err.message || "Failed to file report." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "28px 32px", animation: "fadeIn .3s ease", maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--red)", marginBottom: 4, letterSpacing: "0.1em" }}>
          INCIDENT FILING
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>Report Stolen ID</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 13 }}>
          Submit an official stolen national identity document report to the national registry.
        </p>
      </div>

      <Alert type={alert?.type} msg={alert?.msg} onClose={() => setAlert(null)} />

      <Card>
        {/* Warning banner */}
        <div style={{
          background: "rgba(244,162,97,0.08)", border: "1px solid rgba(244,162,97,0.3)",
          borderRadius: 6, padding: "10px 14px", marginBottom: 20,
          display: "flex", gap: 10, alignItems: "center", fontSize: 12,
          color: "var(--amber)", fontFamily: "var(--font-mono)"
        }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          Filing false reports is a criminal offence under Law No. 143/1994. All submissions are logged and audited.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Input
              label="National ID Number"
              id="national_id"
              placeholder="Enter 14-digit national ID"
              value={form.national_id}
              onChange={e => setForm(p => ({ ...p, national_id: e.target.value }))}
              error={errors.national_id}
              icon="🪪"
            />
          </div>
          <Input
            label="Police Report Number"
            id="report_number"
            placeholder="e.g. RPT-2024-00123"
            value={form.report_number}
            onChange={e => setForm(p => ({ ...p, report_number: e.target.value }))}
            error={errors.report_number}
            icon="📄"
          />
          <Input
            label="Police Station"
            id="police_station"
            placeholder="e.g. Cairo Central Station"
            value={form.police_station}
            onChange={e => setForm(p => ({ ...p, police_station: e.target.value }))}
            error={errors.police_station}
            icon="🏛"
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <Button variant="danger" loading={loading} onClick={handleSubmit}>
            ⊕ Submit Stolen Report
          </Button>
          <Button variant="ghost" onClick={() => setForm({ national_id: "", report_number: "", police_station: "" })}>
            Clear Form
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Check ID Page ────────────────────────────────────────────────────────────

function CheckPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    const id = query.trim();
    if (!id) { setError("Please enter a national ID number."); return; }
    if (!/^\d{5,20}$/.test(id)) { setError("ID must be 5–20 digits."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const data = await api.get(`/check-id?national_id=${encodeURIComponent(id)}`, token);
      setResult(data);
    } catch (err) {
      setError(err.message || "Lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "28px 32px", animation: "fadeIn .3s ease", maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--accent)", marginBottom: 4, letterSpacing: "0.1em" }}>
          IDENTITY VERIFICATION
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>Check National ID</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 13 }}>
          Query the national stolen identity registry in real-time.
        </p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input
              label="National ID Number"
              id="check_id"
              placeholder="Enter national ID to verify..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              error={error}
              icon="🔍"
              onKeyDown={e => e.key === "Enter" && handleCheck()}
            />
          </div>
          <div style={{ marginBottom: error ? 22 : 16 }}>
            <Button loading={loading} onClick={handleCheck}>Verify</Button>
          </div>
        </div>
      </Card>

      {loading && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
            <Spinner />
            Querying national registry...
          </div>
        </Card>
      )}

      {result && !loading && (
        <Card style={{
          border: `1px solid ${result.status === "stolen" ? "var(--red)" : "var(--green)"}`,
          boxShadow: `0 0 20px ${result.status === "stolen" ? "var(--red-glow)" : "var(--green-glow)"}`,
          animation: "fadeIn .3s ease"
        }}>
          {/* Result header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid var(--border)"
          }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.1em" }}>VERIFICATION RESULT</div>
              <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4, fontFamily: "var(--font-mono)" }}>{query}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Badge status={result.status} />
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {result.status === "stolen" ? (
            <div>
              <div style={{
                background: "var(--red-glow)", border: "1px solid var(--red)", borderRadius: 6,
                padding: "12px 16px", marginBottom: 16, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--red)"
              }}>
                ⚠ THIS IDENTITY DOCUMENT HAS BEEN REPORTED AS STOLEN — DO NOT ACCEPT
              </div>
              {result.data && Object.keys(result.data).length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                  {Object.entries(result.data).map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{k.replace(/_/g, " ")}</div>
                      <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: "var(--green-glow)", border: "1px solid var(--green)", borderRadius: 6,
              padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--green)",
              display: "flex", alignItems: "center", gap: 10
            }}>
              <span style={{ fontSize: 20 }}>✔</span>
              This national ID has NOT been reported stolen. Document appears valid.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

function AdminPage() {
  const { token, isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await api.get("/all", token);
      setRecords(Array.isArray(data) ? data : data.records || data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load records.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (isAdmin) fetchAll(); }, [fetchAll, isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{ padding: "28px 32px", animation: "fadeIn .3s ease" }}>
        <Card style={{ border: "1px solid var(--red)", maxWidth: 500 }}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Access Denied</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              This section requires administrator privileges.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return !q || JSON.stringify(r).toLowerCase().includes(q);
  });

  const cols = records.length > 0 ? Object.keys(records[0]) : ["national_id", "report_number", "police_station", "status"];

  return (
    <div style={{ padding: "28px 32px", animation: "fadeIn .3s ease" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--amber)", marginBottom: 4, letterSpacing: "0.1em" }}>ADMINISTRATOR ACCESS</div>
          <h1 style={{ fontSize: 24, fontWeight: 900 }}>Stolen ID Registry</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 13 }}>
            Full database of reported stolen national identity documents.
          </p>
        </div>
        <Button onClick={fetchAll} loading={loading} small>↻ Refresh</Button>
      </div>

      {error && <Alert type="error" msg={error} onClose={() => setError("")} />}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              background: "var(--red-glow)", border: "1px solid var(--red)", borderRadius: 4,
              padding: "4px 12px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--red)", fontWeight: 700
            }}>
              {filtered.length} RECORD{filtered.length !== 1 ? "S" : ""}
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>TOTAL STOLEN IDs IN REGISTRY</span>
          </div>
          <div style={{ minWidth: 220 }}>
            <Input
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon="🔍"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Spinner size={28} />
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
            {search ? "No records match your search." : "No records found in the registry."}
          </div>
        </Card>
      ) : (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
          overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 700 }}>#</th>
                  {cols.map(c => (
                    <th key={c} style={{
                      padding: "10px 16px", textAlign: "left",
                      fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em",
                      textTransform: "uppercase", fontWeight: 700, whiteSpace: "nowrap"
                    }}>{c.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background .15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "10px 16px", color: "var(--text-muted)", fontSize: 11 }}>{i + 1}</td>
                    {cols.map(c => (
                      <td key={c} style={{ padding: "10px 16px", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                        {c === "status" ? <Badge status={row[c]} /> : (row[c] !== undefined && row[c] !== null ? String(row[c]) : "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.password) e.password = "Password is required";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true); setAlert(null);
    try {
      const data = await api.post("/login", form);
      login(data.access_token, data.role, form.username);
    } catch (err) {
      setAlert({ type: "error", msg: err.message || "Invalid credentials." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-base)", padding: 20,
      backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(29,107,222,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(230,57,70,0.05) 0%, transparent 50%)"
    }}>
      <div style={{ width: "100%", maxWidth: 420, animation: "fadeIn .4s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, background: "var(--accent)", borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 16px",
            boxShadow: "0 0 30px var(--accent-glow)"
          }}>⚖</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.05em" }}>SID SYSTEM</h1>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
            NATIONAL ID AUTHORITY — AUTHORIZED ACCESS ONLY
          </p>
        </div>

        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Officer Sign In</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, fontFamily: "var(--font-mono)" }}>
            Enter your credentials to access the secure portal
          </p>

          <Alert type={alert?.type} msg={alert?.msg} onClose={() => setAlert(null)} />

          <Input label="Username" id="login_user" placeholder="Enter username" value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            error={errors.username} icon="👤"
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
          <Input label="Password" id="login_pass" type="password" placeholder="Enter password" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            error={errors.password} icon="🔑"
            onKeyDown={e => e.key === "Enter" && handleLogin()} />

          <Button fullWidth loading={loading} onClick={handleLogin} style={{ marginTop: 4 }}>
            Sign In
          </Button>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
            No account?{" "}
            <span onClick={onSwitch} style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}>
              Register here
            </span>
          </p>
        </Card>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          RESTRICTED GOVERNMENT SYSTEM — UNAUTHORIZED ACCESS IS PROHIBITED
        </p>
      </div>
    </div>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────

function RegisterPage({ onSwitch }) {
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required";
    else if (form.username.length < 3) e.username = "Min 3 characters";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Min 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true); setAlert(null);
    try {
      await api.post("/register", { username: form.username, password: form.password });
      setAlert({ type: "success", msg: "Account created successfully. You can now sign in." });
      setForm({ username: "", password: "", confirm: "" });
      setTimeout(onSwitch, 2000);
    } catch (err) {
      setAlert({ type: "error", msg: err.message || "Registration failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-base)", padding: 20,
      backgroundImage: "radial-gradient(ellipse at 80% 50%, rgba(29,107,222,0.07) 0%, transparent 60%)"
    }}>
      <div style={{ width: "100%", maxWidth: 420, animation: "fadeIn .4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, background: "var(--accent)", borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 16px", boxShadow: "0 0 30px var(--accent-glow)"
          }}>⚖</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.05em" }}>SID SYSTEM</h1>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
            OFFICER REGISTRATION PORTAL
          </p>
        </div>

        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Create Account</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, fontFamily: "var(--font-mono)" }}>
            Requires authorization from department supervisor
          </p>

          <Alert type={alert?.type} msg={alert?.msg} onClose={() => setAlert(null)} />

          <Input label="Username" id="reg_user" placeholder="Choose a username" value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            error={errors.username} icon="👤" />
          <Input label="Password" id="reg_pass" type="password" placeholder="Choose a password" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            error={errors.password} icon="🔑" />
          <Input label="Confirm Password" id="reg_conf" type="password" placeholder="Confirm your password" value={form.confirm}
            onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
            error={errors.confirm} icon="🔑"
            onKeyDown={e => e.key === "Enter" && handleRegister()} />

          <Button fullWidth loading={loading} onClick={handleRegister}>
            Create Account
          </Button>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
            Already registered?{" "}
            <span onClick={onSwitch} style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}>
              Sign in here
            </span>
          </p>
        </Card>
      </div>
    </div>
  );
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const [screen, setScreen] = useState("login");
  if (screen === "login") return <LoginPage onSwitch={() => setScreen("register")} />;
  return <RegisterPage onSwitch={() => setScreen("login")} />;
}

// ─── App Shell ────────────────────────────────────────────────────────────────

function AppShell() {
  const [page, setPage] = useState("dashboard");

  const pages = {
    dashboard: <DashboardPage setPage={setPage} />,
    report: <ReportPage />,
    check: <CheckPage />,
    admin: <AdminPage />,
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }} className="app-shell">
      <Sidebar page={page} setPage={setPage} />
      <main style={{ flex: 1, overflowY: "auto", paddingTop: 0 }} className="main-content">
        {pages[page] || pages.dashboard}
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function Root() {
  const { token } = useAuth();
  return token ? <AppShell /> : <AuthGate />;
}

export default function App() {
  return (
    <>
      <style>{styles}</style>
      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: block !important; }
          .mobile-topbar { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .main-content { padding-top: 58px !important; }
          .app-shell { flex-direction: column !important; }
        }
      `}</style>
      <div className="scanline-overlay" />
      <AuthProvider>
        <Root />
      </AuthProvider>
    </>
  );
}
