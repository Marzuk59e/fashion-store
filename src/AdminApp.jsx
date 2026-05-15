import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase.js";
import { DEFAULT_PRODUCTS } from "./data/catalog.js";

/* ─── Design tokens ─────────────────────────────────────────── */
const C = {
  bg: "#0C0B09",
  surface: "#141310",
  surface2: "#1C1A16",
  border: "#252219",
  border2: "#302C22",
  gold: "#E2BC5C",
  goldDim: "#A07E35",
  goldBg: "rgba(226,188,92,0.10)",
  text: "#F5F0E8",
  muted: "#A89F8C",
  success: "#4A7C59",
  successBg: "rgba(74,124,89,0.12)",
  error: "#8B3A3A",
  errorBg: "rgba(139,58,58,0.12)",
};

const font = {
  serif: "'Cormorant Garamond', Georgia, serif",
  mono: "'Fira Code', 'Courier New', monospace",
  sans: "'DM Sans', system-ui, sans-serif",
};

/* ─── Validation (unchanged) ────────────────────────────────── */
function validateProductList(list) {
  if (!Array.isArray(list) || list.length === 0) return "Catalog must be a non-empty JSON array.";
  const seen = new Set();
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (!p || typeof p !== "object") return `Row ${i + 1}: invalid object.`;
    if (typeof p.id !== "number") return `Row ${i + 1}: "id" must be a number.`;
    if (seen.has(p.id)) return `Duplicate id: ${p.id}.`;
    seen.add(p.id);
    const need = ["name", "brand", "price", "category", "emoji", "sizes", "bg", "desc"];
    for (const k of need) {
      if (!(k in p)) return `Row ${i + 1}: missing "${k}".`;
    }
    if (typeof p.name !== "string" || !p.name.trim()) return `Row ${i + 1}: invalid name.`;
    if (typeof p.brand !== "string") return `Row ${i + 1}: invalid brand.`;
    if (typeof p.price !== "number" || p.price < 0) return `Row ${i + 1}: invalid price.`;
    if (typeof p.category !== "string") return `Row ${i + 1}: invalid category.`;
    if (typeof p.emoji !== "string") return `Row ${i + 1}: invalid emoji.`;
    if (!Array.isArray(p.sizes) || p.sizes.length === 0) return `Row ${i + 1}: sizes must be a non-empty array.`;
    if (!Array.isArray(p.bg) || p.bg.length < 2 || typeof p.bg[0] !== "string") return `Row ${i + 1}: bg must be [string, string, ...].`;
    if (typeof p.desc !== "string") return `Row ${i + 1}: invalid desc.`;
    if (p.compareAt != null && typeof p.compareAt !== "number") return `Row ${i + 1}: compareAt must be number or omitted.`;
    if (p.badge != null && typeof p.badge !== "string") return `Row ${i + 1}: badge must be string or null.`;
  }
  return null;
}

/* ─── Shared button styles ───────────────────────────────────── */
const btnPrimary = {
  padding: "11px 28px",
  background: C.gold,
  border: "none",
  borderRadius: 8,
  color: "#0C0B09",
  fontSize: 13,
  fontWeight: 800,
  fontFamily: font.sans,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const btnGhost = {
  padding: "11px 20px",
  background: "transparent",
  border: `1px solid ${C.border2}`,
  borderRadius: 8,
  color: C.muted,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: font.sans,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
};

/* ─── Loading screen ─────────────────────────────────────────── */
function LoadingScreen({ text = "Loading…" }) {
  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16,
    }}>
      <div style={{
        width: 34, height: 34, border: `2px solid ${C.border2}`,
        borderTopColor: C.gold, borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: C.muted, fontSize: 13, fontFamily: font.sans, margin: 0 }}>{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Login page ─────────────────────────────────────────────── */
function LoginPage({ storefrontUrl, busy, msg, email, password, setEmail, setPassword, onLogin }) {
  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: font.sans,
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: "48px 40px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            border: `1px solid ${C.border2}`, background: C.goldBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 20, color: C.gold,
          }}>✦</div>
          <h1 style={{
            margin: "0 0 6px", fontSize: 22, fontWeight: 300,
            fontFamily: font.serif, color: C.gold, letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}>Sanjiiiii</h1>
          <p style={{ margin: 0, fontSize: 11, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Admin Portal</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onLogin()}
            style={{
              padding: "13px 16px", borderRadius: 8,
              border: `1px solid ${C.border2}`,
              background: C.bg, color: C.text,
              fontSize: 14, fontFamily: font.sans, outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = C.gold}
            onBlur={e => e.target.style.borderColor = C.border2}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onLogin()}
            style={{
              padding: "13px 16px", borderRadius: 8,
              border: `1px solid ${C.border2}`,
              background: C.bg, color: C.text,
              fontSize: 14, fontFamily: font.sans, outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = C.gold}
            onBlur={e => e.target.style.borderColor = C.border2}
          />

          {msg && (
            <p style={{
              margin: 0, padding: "10px 14px", borderRadius: 6,
              background: C.errorBg, color: "#CF8A8A",
              border: `1px solid ${C.error}44`, fontSize: 13,
            }}>{msg}</p>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={onLogin}
            style={{
              ...btnPrimary, width: "100%", padding: "14px",
              opacity: busy ? 0.7 : 1, cursor: busy ? "wait" : "pointer",
              marginTop: 4, fontSize: 13,
            }}
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </div>

        <a href={storefrontUrl} style={{
          display: "block", textAlign: "center", marginTop: 24,
          color: C.muted, fontSize: 12, textDecoration: "none",
          fontFamily: font.sans, letterSpacing: "0.04em",
        }}>
          ← Back to storefront
        </a>
      </div>
    </div>
  );
}

/* ─── Access Denied ──────────────────────────────────────────── */
function AccessDenied({ user, storefrontUrl, onLogout }) {
  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: font.sans, padding: 24,
    }}>
      <div style={{
        maxWidth: 520, background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: 16, padding: "40px 36px",
      }}>
        <p style={{ margin: "0 0 16px", fontSize: 26, lineHeight: 1 }}>⛔</p>
        <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 500, color: C.text }}>Access Denied</h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
          Your account (<span style={{ color: C.text }}>{user.email || user.uid}</span>) is not in the{" "}
          <code style={{ color: C.gold, fontSize: 13 }}>admins</code> collection.
        </p>
        <div style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ margin: "0 0 10px", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Steps to grant access</p>
          <ol style={{ margin: 0, paddingLeft: 20, color: C.text, fontSize: 13, lineHeight: 1.9 }}>
            <li>Open Firebase Console → Firestore.</li>
            <li>Create collection <strong style={{ color: C.gold }}>admins</strong> (if missing).</li>
            <li>Add document ID: <code style={{ color: C.gold, fontSize: 12, background: C.goldBg, padding: "1px 6px", borderRadius: 4 }}>{user.uid}</code></li>
            <li>Set field <code style={{ color: C.gold }}>active</code> = <strong>true</strong>.</li>
            <li>Deploy updated Firestore rules, then refresh.</li>
          </ol>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" onClick={onLogout} style={btnGhost}>Sign out</button>
          <a href={storefrontUrl} style={{ ...btnGhost, textDecoration: "none", display: "inline-block" }}>← Storefront</a>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────── */
function StatCard({ label, value, accent = C.gold }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${accent}`, borderRadius: 12,
      padding: "20px 24px", flex: 1, minWidth: 150,
    }}>
      <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: font.sans }}>{label}</p>
      <p style={{ margin: 0, fontSize: 36, fontWeight: 400, color: C.text, fontFamily: font.serif, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function MsgBanner({ msg }) {
  if (!msg) return null;
  const isErr = /fail|invalid|error|denied|could not/i.test(msg);
  return (
    <div style={{
      padding: "12px 16px", borderRadius: 8, marginBottom: 20,
      background: isErr ? C.errorBg : C.successBg,
      border: `1px solid ${isErr ? C.error : C.success}44`,
      color: isErr ? "#CF8A8A" : "#8BCF9A",
      fontSize: 14, fontFamily: font.sans,
    }}>
      {isErr ? "⚠ " : "✓ "}{msg}
    </div>
  );
}

function NavBtn({ id, label, icon, active, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "10px 18px",
        background: active ? C.goldBg : hover ? "rgba(255,255,255,0.025)" : "transparent",
        border: "none", borderLeft: `2px solid ${active ? C.gold : "transparent"}`,
        color: active ? C.gold : hover ? C.text : C.muted,
        fontSize: 13, fontFamily: font.sans, fontWeight: active ? 700 : 500,
        letterSpacing: "0.08em", textTransform: "uppercase",
        cursor: "pointer", textAlign: "left", transition: "all 0.15s",
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </button>
  );
}

/* ─── Main export ────────────────────────────────────────────── */
export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [adminOk, setAdminOk] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [liveProducts, setLiveProducts] = useState(DEFAULT_PRODUCTS);
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(DEFAULT_PRODUCTS, null, 2));
  const [customers, setCustomers] = useState([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const storefrontUrl = useMemo(() => {
    const u = new URL(window.location.href);
    u.pathname = u.pathname.replace(/\/admin\.html$/i, "/");
    u.hash = "";
    return u.origin + "/";
  }, []);

  useEffect(() => { document.title = "Admin · sanjiiiii"; }, []);

  /* Inject fonts once */
  useEffect(() => {
    if (document.getElementById("admin-fonts")) return;
    const link = document.createElement("link");
    link.id = "admin-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500;600&family=Fira+Code:wght@400&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) { setAdminOk(false); setAdminCheckDone(true); return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const ok = snap.exists() && snap.data()?.role === "admin";
        if (!cancelled) { setAdminOk(ok); setAdminCheckDone(true); }
      } catch {
        if (!cancelled) { setAdminOk(false); setAdminCheckDone(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!adminOk) return undefined;
    const cref = doc(db, "catalog", "store");
    const unsub = onSnapshot(cref, (snap) => {
      if (!snap.exists()) {
        setLiveProducts(DEFAULT_PRODUCTS);
        setJsonDraft(JSON.stringify(DEFAULT_PRODUCTS, null, 2));
        return;
      }
      const list = snap.data()?.products;
      if (Array.isArray(list) && list.length) {
        setLiveProducts(list);
        setJsonDraft(JSON.stringify(list, null, 2));
      } else {
        setLiveProducts(DEFAULT_PRODUCTS);
        setJsonDraft(JSON.stringify(DEFAULT_PRODUCTS, null, 2));
      }
    });
    return () => unsub();
  }, [adminOk]);

  const loginEmail = async () => {
    setBusy(true); setMsg("");
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch { setMsg("Invalid email or password."); }
    finally { setBusy(false); }
  };

  const logout = async () => {
    try { await signOut(auth); } catch { void 0; }
    setCustomers([]); setCustomersLoaded(false);
  };

  const loadCustomers = useCallback(async () => {
    if (!adminOk) return;
    setBusy(true); setMsg("");
    try {
      const q = query(collection(db, "users"), limit(200));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => {
        const x = d.data() || {};
        const orders = Array.isArray(x.orders) ? x.orders : [];
        return { id: d.id, email: x.email || "—", name: x.name || "—", orders: orders.length };
      });
      rows.sort((a, b) => b.orders - a.orders);
      setCustomers(rows); setCustomersLoaded(true);
    } catch (e) {
      setMsg(e?.message || "Could not load customers.");
    } finally { setBusy(false); }
  }, [adminOk]);

  const saveCatalog = async () => {
    setMsg("");
    let parsed;
    try { parsed = JSON.parse(jsonDraft); }
    catch (e) { setMsg(`Invalid JSON: ${e?.message || "parse error"}`); return; }
    const err = validateProductList(parsed);
    if (err) { setMsg(err); return; }
    setBusy(true);
    try {
      await setDoc(
        doc(db, "catalog", "store"),
        { products: parsed, updatedAt: serverTimestamp(), updatedBy: user?.email || user?.uid || null },
        { merge: true },
      );
      setMsg("Catalog saved. Storefront updates automatically.");
    } catch (e) {
      setMsg(e?.message || "Save failed. Check Firestore rules and admin document.");
    } finally { setBusy(false); }
  };

  const resetDraftToDefaults = () => {
    setJsonDraft(JSON.stringify(DEFAULT_PRODUCTS, null, 2));
    setMsg("Editor reset to built-in defaults (not saved yet).");
  };

  /* ── Guards ───────────────────────────────────────────────── */
  if (!authReady) return <LoadingScreen text="Loading…" />;
  if (!adminCheckDone) return <LoadingScreen text="Checking admin access…" />;
  if (!user) return (
    <LoginPage
      storefrontUrl={storefrontUrl} busy={busy} msg={msg}
      email={email} password={password}
      setEmail={setEmail} setPassword={setPassword}
      onLogin={loginEmail}
    />
  );
  if (!adminOk) return <AccessDenied user={user} storefrontUrl={storefrontUrl} onLogout={logout} />;

  /* ── Admin shell ──────────────────────────────────────────── */
  const navItems = [
    { id: "dashboard", label: "Overview", icon: "◈" },
    { id: "products", label: "Catalog JSON", icon: "⟨⟩" },
    { id: "customers", label: "Customers", icon: "◉" },
  ];

  let jsonParseError = null;
  try { JSON.parse(jsonDraft); } catch (e) { jsonParseError = e.message; }

  const productCount = (() => {
    try { const n = JSON.parse(jsonDraft).length; return `${n} product${n !== 1 ? "s" : ""}`; }
    catch { return "—"; }
  })();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: font.sans, display: "flex", flexDirection: "column" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 3px; }
        textarea:focus { outline: none !important; box-shadow: 0 0 0 2px ${C.gold}2A; }
        input::placeholder { color: ${C.muted}; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Top bar ───────────────────────────────────────────── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: 54,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.gold, fontSize: 16 }}>✦</span>
          <span style={{ fontSize: 15, fontWeight: 400, fontFamily: font.serif, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold }}>
            Sanjiiiii
          </span>
          <span style={{ color: C.border2, margin: "0 4px" }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.muted, letterSpacing: "0.04em" }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>{user.email}</span>
          <a
            href={storefrontUrl} target="_blank" rel="noreferrer"
            style={{ fontSize: 13, fontWeight: 600, color: C.gold, textDecoration: "none", letterSpacing: "0.04em" }}
          >
            View store ↗
          </a>
          <button
            type="button" onClick={logout}
            style={{ ...btnGhost, padding: "6px 14px", fontSize: 11 }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <aside style={{
          width: 210, background: C.surface, borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}>
          <nav style={{ padding: "20px 0", flex: 1 }}>
            {navItems.map(n => (
              <NavBtn key={n.id} {...n} active={tab === n.id} onClick={(id) => { setTab(id); setMsg(""); }} />
            ))}
          </nav>

          {/* User badge */}
          <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: C.goldBg, border: `1px solid ${C.border2}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: C.gold, fontWeight: 700, flexShrink: 0,
              }}>
                {(user.email?.[0] || "A").toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.email}
                </p>
                <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, marginTop: 2 }}>Admin</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>

          {/* ── Overview ──────────────────────────────────────── */}
          {tab === "dashboard" && (
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 400, color: C.text, fontFamily: font.serif, marginBottom: 6, letterSpacing: "0.02em" }}>
                Overview
              </h2>
              <p style={{ fontSize: 14, fontWeight: 500, color: C.muted, marginBottom: 28 }}>
                Live data from Firestore · <span style={{ color: C.gold }}>catalog/store</span>
              </p>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
                <StatCard label="Products live" value={liveProducts.length} />
                <StatCard label="Customers loaded" value={customersLoaded ? customers.length : "—"} accent="#5A7D8A" />
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 28px", maxWidth: 620 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: font.mono, marginBottom: 18 }}>
                  Quick guide
                </p>
                {[
                  { n: "01", t: "Edit catalog", d: "Go to Catalog JSON, edit the product array, then click Save. The storefront reads catalog/store in real time." },
                  { n: "02", t: "Manage customers", d: "Load up to 200 Firebase sign-in users from the Customers tab." },
                  { n: "03", t: "Grant admin access", d: "Create admins/<Firebase UID> in Firestore with active: true." },
                ].map(({ n, t, d }) => (
                  <div key={n} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: font.mono, minWidth: 18, paddingTop: 3 }}>{n}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{t}</p>
                      <p style={{ fontSize: 13, fontWeight: 400, color: C.muted, lineHeight: 1.65 }}>{d}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4CAF7C", display: "inline-block" }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>Store is live · Connected to Firebase</span>
              </div>
            </div>
          )}

          {/* ── Catalog JSON ──────────────────────────────────── */}
          {tab === "products" && (
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 400, color: C.text, fontFamily: font.serif, marginBottom: 6 }}>
                Catalog JSON
              </h2>
              <p style={{ fontSize: 14, fontWeight: 500, color: C.muted, marginBottom: 20 }}>
                Valid JSON array of product objects. Invalid saves are rejected before upload.
              </p>

              <MsgBanner msg={msg} />

              <textarea
                value={jsonDraft}
                onChange={e => setJsonDraft(e.target.value)}
                spellCheck={false}
                style={{
                  width: "100%", minHeight: 440,
                  background: C.surface, color: C.text,
                  border: `1px solid ${jsonParseError ? C.error : C.border}`,
                  borderRadius: 10, padding: "18px 20px",
                  fontFamily: font.mono, fontSize: 13.5, lineHeight: 1.75,
                  resize: "vertical", transition: "border-color 0.2s",
                  display: "block",
                }}
              />

              {jsonParseError && (
                <p style={{ marginTop: 6, fontSize: 12, color: "#CF8A8A", fontFamily: font.mono }}>
                  ⚠ {jsonParseError}
                </p>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button" disabled={busy || !!jsonParseError}
                  onClick={saveCatalog}
                  style={{ ...btnPrimary, opacity: busy || jsonParseError ? 0.5 : 1, cursor: busy || jsonParseError ? "not-allowed" : "pointer" }}
                >
                  {busy ? "Saving…" : "Save to Firestore"}
                </button>
                <button
                  type="button" disabled={busy}
                  onClick={resetDraftToDefaults}
                  style={btnGhost}
                >
                  Reset to defaults
                </button>
                <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: C.muted, fontFamily: font.mono }}>
                  {productCount}
                </span>
              </div>
            </div>
          )}

          {/* ── Customers ─────────────────────────────────────── */}
          {tab === "customers" && (
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 400, color: C.text, fontFamily: font.serif, marginBottom: 6 }}>
                Customers
              </h2>
              <p style={{ fontSize: 14, fontWeight: 500, color: C.muted, marginBottom: 20 }}>
                Up to 200 Firebase sign-in users. Local-only accounts are not listed.
              </p>

              <MsgBanner msg={msg} />

              <button
                type="button" disabled={busy} onClick={loadCustomers}
                style={{
                  ...btnGhost, marginBottom: 20,
                  color: customersLoaded ? C.muted : C.gold,
                  borderColor: customersLoaded ? C.border2 : C.gold,
                }}
              >
                {busy ? "Loading…" : customersLoaded ? "Reload list" : "Load customers"}
              </button>

              {!customersLoaded && !busy && (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", minHeight: 200, gap: 12, color: C.muted,
                }}>
                  <span style={{ fontSize: 32, opacity: 0.4 }}>◉</span>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Customer data not loaded yet</p>
                </div>
              )}

              {customersLoaded && (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.muted, fontFamily: font.mono, marginBottom: 12 }}>
                    {customers.length} customer{customers.length !== 1 ? "s" : ""} loaded
                  </p>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                          {["Name", "Email", "Orders", "UID"].map(h => (
                            <th key={h} style={{
                              padding: "13px 16px", textAlign: "left",
                              color: C.muted, fontWeight: 700, fontSize: 12,
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              fontFamily: font.mono,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((c, i) => (
                          <tr
                            key={c.id}
                            style={{ borderBottom: i < customers.length - 1 ? `1px solid ${C.border}` : "none" }}
                            onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <td style={{ padding: "14px 16px", color: C.text, fontWeight: 500 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                  width: 30, height: 30, borderRadius: "50%",
                                  background: C.goldBg, border: `1px solid ${C.border2}`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 12, color: C.gold, fontWeight: 700, flexShrink: 0,
                                }}>
                                  {(c.name !== "—" ? c.name : c.email)?.[0]?.toUpperCase() || "?"}
                                </div>
                                {c.name}
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px", color: C.muted, fontSize: 13, fontWeight: 500 }}>{c.email}</td>
                            <td style={{ padding: "14px 16px", color: C.text, fontFamily: font.mono, fontWeight: 600 }}>{c.orders}</td>
                            <td style={{ padding: "14px 16px", color: C.muted, fontFamily: font.mono, fontSize: 11, fontWeight: 500 }}>{c.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}