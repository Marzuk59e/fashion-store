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
import { auth, db, googleProvider } from "./firebase.js";
import { DEFAULT_PRODUCTS } from "./data/catalog.js";

const shell = {
  minHeight: "100vh",
  background: "#0c0c0c",
  color: "#e8e6e3",
  fontFamily: "'Montserrat', system-ui, sans-serif",
  fontSize: 14,
};

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

  useEffect(() => {
    document.title = "Admin · sanjiiiii";
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setAdminOk(false);
      setAdminCheckDone(true);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const ok = snap.exists() && snap.data()?.role === "admin";
        if (!cancelled) {
          setAdminOk(ok);
          setAdminCheckDone(true);
        }
      } catch {
        if (!cancelled) {
          setAdminOk(false);
          setAdminCheckDone(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
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
    setBusy(true);
    setMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setMsg("Invalid email or password.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      void 0;
    }
    setCustomers([]);
    setCustomersLoaded(false);
  };

  const loadCustomers = useCallback(async () => {
    if (!adminOk) return;
    setBusy(true);
    setMsg("");
    try {
      const q = query(collection(db, "users"), limit(200));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => {
        const x = d.data() || {};
        const orders = Array.isArray(x.orders) ? x.orders : [];
        return {
          id: d.id,
          email: x.email || "—",
          name: x.name || "—",
          orders: orders.length,
        };
      });
      rows.sort((a, b) => b.orders - a.orders);
      setCustomers(rows);
      setCustomersLoaded(true);
    } catch (e) {
      setMsg(e?.message || "Could not load customers.");
    } finally {
      setBusy(false);
    }
  }, [adminOk]);

  const saveCatalog = async () => {
    setMsg("");
    let parsed;
    try {
      parsed = JSON.parse(jsonDraft);
    } catch (e) {
      setMsg(`Invalid JSON: ${e?.message || "parse error"}`);
      return;
    }
    const err = validateProductList(parsed);
    if (err) {
      setMsg(err);
      return;
    }
    setBusy(true);
    try {
      await setDoc(
        doc(db, "catalog", "store"),
        {
          products: parsed,
          updatedAt: serverTimestamp(),
          updatedBy: user?.email || user?.uid || null,
        },
        { merge: true },
      );
      setMsg("Catalog saved. Storefront updates automatically.");
    } catch (e) {
      setMsg(e?.message || "Save failed. Check Firestore rules and admin document.");
    } finally {
      setBusy(false);
    }
  };

  const resetDraftToDefaults = () => {
    setJsonDraft(JSON.stringify(DEFAULT_PRODUCTS, null, 2));
    setMsg("Editor reset to built-in defaults (not saved yet).");
  };

  if (!authReady) {
    return (
      <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ opacity: 0.7 }}>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: "100%", maxWidth: 420, background: "#161616",
          padding: "40px 36px", borderRadius: 14, border: "1px solid #2a2a2a"
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, textAlign: "center" }}>
            sanjiiiii Admin
          </h1>
          <p style={{ opacity: 0.6, marginBottom: 28, textAlign: "center", fontSize: 13 }}>
            Admin login
          </p>
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              padding: "12px 16px", borderRadius: 8, border: "1px solid #333",
              background: "#0f0f0f", color: "#eee", width: "100%",
              marginBottom: 12, boxSizing: "border-box", fontSize: 14
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              padding: "12px 16px", borderRadius: 8, border: "1px solid #333",
              background: "#0f0f0f", color: "#eee", width: "100%",
              marginBottom: 20, boxSizing: "border-box", fontSize: 14
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={loginEmail}
            style={{
              padding: "13px", borderRadius: 8, border: "none",
              cursor: busy ? "wait" : "pointer", background: "#c9a96e",
              color: "#111", fontWeight: 700, width: "100%", fontSize: 15
            }}
          >
            {busy ? "Please wait…" : "Sign In"}
          </button>
          <a href={storefrontUrl} style={{
            display: "block", marginTop: 20,
            color: "#c9a96e", fontSize: 13, textAlign: "center"
          }}>
            ← Back to storefront
          </a>
        </div>
      </div>
    );
  }

  if (adminCheckDone && !adminOk) {
    return (
      <div style={{ ...shell, padding: 32, maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Access denied</h1>
        <p style={{ lineHeight: 1.65, opacity: 0.85, marginBottom: 16 }}>
          Your account ({user.email || user.uid}) is not in the <code style={{ color: "#c9a96e" }}>admins</code> collection.
        </p>
        <ol style={{ lineHeight: 1.7, opacity: 0.9, paddingLeft: 20 }}>
          <li>Open Firebase Console → Firestore.</li>
          <li>Create collection <strong>admins</strong> (if missing).</li>
          <li>
            Add document ID: <strong>{user.uid}</strong> with field <code>active</code> (boolean) = <strong>true</strong>.
          </li>
          <li>Deploy updated <code>firestore.rules</code> from this repo.</li>
          <li>Refresh this page.</li>
        </ol>
        <button type="button" onClick={logout} style={{ marginTop: 24, padding: "10px 20px", background: "#333", color: "#fff", border: "1px solid #555", borderRadius: 6, cursor: "pointer" }}>
          Sign out
        </button>
        <div style={{ marginTop: 20 }}>
          <a href={storefrontUrl} style={{ color: "#c9a96e" }}>← Storefront</a>
        </div>
      </div>
    );
  }

  if (!adminCheckDone) {
    return (
      <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ opacity: 0.7 }}>Checking admin access…</p>
      </div>
    );
  }

  const tabs = [
    ["dashboard", "Overview"],
    ["products", "Catalog JSON"],
    ["customers", "Customers"],
  ];

  return (
    <div style={shell}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 22px",
          borderBottom: "1px solid #222",
          background: "#111",
        }}
      >
        <div style={{ fontWeight: 700, letterSpacing: "0.06em" }}>SANJIIIII ADMIN</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 13 }}>
          <span style={{ opacity: 0.75 }}>{user.email}</span>
          <a href={storefrontUrl} style={{ color: "#c9a96e", textDecoration: "none" }} target="_blank" rel="noreferrer">
            View store
          </a>
          <button type="button" onClick={logout} style={{ padding: "6px 12px", background: "#2a2a2a", border: "1px solid #444", color: "#ddd", borderRadius: 4, cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 53px)" }}>
        <aside style={{ width: 200, borderRight: "1px solid #222", padding: 16, background: "#101010" }}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                marginBottom: 6,
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                background: tab === id ? "#c9a96e" : "transparent",
                color: tab === id ? "#111" : "#ccc",
                fontWeight: tab === id ? 600 : 500,
              }}
            >
              {label}
            </button>
          ))}
        </aside>

        <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
          {msg && (
            <div style={{ marginBottom: 16, padding: 12, background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, fontSize: 13 }}>
              {msg}
            </div>
          )}

          {tab === "dashboard" && (
            <div>
              <h2 style={{ fontSize: 18, marginBottom: 16 }}>Overview</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
                <div style={{ padding: 16, background: "#161616", borderRadius: 8, border: "1px solid #2a2a2a" }}>
                  <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>Products live</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{liveProducts.length}</div>
                </div>
                <div style={{ padding: 16, background: "#161616", borderRadius: 8, border: "1px solid #2a2a2a" }}>
                  <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>Customers loaded</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{customersLoaded ? customers.length : "—"}</div>
                </div>
              </div>
              <p style={{ marginTop: 24, lineHeight: 1.65, opacity: 0.8, maxWidth: 640 }}>
                Edit the catalog in <strong>Catalog JSON</strong>, then save. The main site reads <code>catalog/store</code> in real time. Grant access by creating <code>admins/&lt;your Firebase uid&gt;</code> in Firestore.
              </p>
            </div>
          )}

          {tab === "products" && (
            <div>
              <h2 style={{ fontSize: 18, marginBottom: 12 }}>Catalog (Firestore)</h2>
              <p style={{ opacity: 0.75, marginBottom: 12, fontSize: 13, maxWidth: 720 }}>
                Valid JSON array of product objects (same shape as defaults). Invalid saves are rejected before upload.
              </p>
              <textarea
                value={jsonDraft}
                onChange={(e) => setJsonDraft(e.target.value)}
                spellCheck={false}
                style={{
                  width: "100%",
                  minHeight: 420,
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 12,
                  padding: 14,
                  borderRadius: 8,
                  border: "1px solid #333",
                  background: "#0a0a0a",
                  color: "#ddd",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button type="button" disabled={busy} onClick={saveCatalog} style={{ padding: "10px 20px", background: "#c9a96e", border: "none", borderRadius: 6, fontWeight: 600, cursor: busy ? "wait" : "pointer" }}>
                  Save to Firestore
                </button>
                <button type="button" disabled={busy} onClick={resetDraftToDefaults} style={{ padding: "10px 20px", background: "#2a2a2a", border: "1px solid #444", color: "#eee", borderRadius: 6, cursor: "pointer" }}>
                  Reset editor to defaults
                </button>
              </div>
            </div>
          )}

          {tab === "customers" && (
            <div>
              <h2 style={{ fontSize: 18, marginBottom: 12 }}>Customers</h2>
              <p style={{ opacity: 0.75, marginBottom: 14, fontSize: 13 }}>
                Reads up to 200 user profile documents (Firebase sign-in users). Local-only accounts are not listed here.
              </p>
              <button type="button" disabled={busy} onClick={loadCustomers} style={{ marginBottom: 16, padding: "10px 18px", background: "#2a2a2a", border: "1px solid #444", color: "#eee", borderRadius: 6, cursor: "pointer" }}>
                {customersLoaded ? "Reload list" : "Load customers"}
              </button>
              {customersLoaded && (
                <div style={{ overflowX: "auto", border: "1px solid #2a2a2a", borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#161616", textAlign: "left" }}>
                        <th style={{ padding: 10, borderBottom: "1px solid #333" }}>Email</th>
                        <th style={{ padding: 10, borderBottom: "1px solid #333" }}>Name</th>
                        <th style={{ padding: 10, borderBottom: "1px solid #333" }}>Orders</th>
                        <th style={{ padding: 10, borderBottom: "1px solid #333" }}>UID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id} style={{ borderBottom: "1px solid #222" }}>
                          <td style={{ padding: 10 }}>{c.email}</td>
                          <td style={{ padding: 10 }}>{c.name}</td>
                          <td style={{ padding: 10 }}>{c.orders}</td>
                          <td style={{ padding: 10, fontFamily: "monospace", fontSize: 11, opacity: 0.85 }}>{c.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
