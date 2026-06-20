import { useCallback, useEffect, useState } from "react";
import {
  onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, updateProfile,
} from "firebase/auth";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs,
  limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc,
} from "firebase/firestore";

import { adminAuth, adminDb } from "./firebase.js";
import { DEFAULT_PRODUCTS } from "./data/catalog.js";
import { normalizeProduct, normalizeProductList } from "./data/productImages.js";
import { validateProductList } from "./utils/validation.js";
import { ADMIN_SECRET_KEY, BYPASS_AUTH, C, font, S } from "./constants.js";

import AdminLogin        from "./AdminLogin.jsx";
import LoadingScreen     from "./components/LoadingScreen.jsx";
import NavBtn            from "./components/NavBtn.jsx";
import AccessDenied      from "./components/AccessDenied.jsx";

import DashboardPage     from "./pages/DashboardPage.jsx";
import ProductsPage      from "./pages/products/ProductsPage.jsx";
import OrdersPage        from "./pages/OrdersPage.jsx";
import CustomersPage     from "./pages/CustomersPage.jsx";
import StockRequestsPage from "./pages/StockRequestsPage.jsx";
import PromoCodesPage    from "./pages/PromoCodesPage.jsx";

const storefrontUrl = import.meta.env.VITE_STOREFRONT_URL ?? "/";

/* ─── Helper: preserve docId after normalization ─────────────
   normalizeProductList can create new objects and drop extra
   fields like docId. We re-attach them by matching on id.     */
function attachDocIds(normalized, raw) {
  return normalized.map(p => ({
    ...p,
    docId: raw.find(r => Number(r.id) === Number(p.id))?.docId ?? p.docId,
  }));
}

export default function AdminApp() {
  /* ─── State ─────────────────────────────────────────────── */
  const [tab,             setTab]             = useState("dashboard");
  const [user,            setUser]            = useState(null);
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [adminOk,         setAdminOk]         = useState(false);
  const [authReady,       setAuthReady]       = useState(false);
  const [adminCheckDone,  setAdminCheckDone]  = useState(false);
  const [products,        setProducts]        = useState([]);
  const [orders,          setOrders]          = useState([]);
  const [customers,       setCustomers]       = useState([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [stockRequests,   setStockRequests]   = useState([]);
  const [promoCodes,      setPromoCodes]      = useState([]);
  const [busy,            setBusy]            = useState(false);
  const [msg,             setMsg]             = useState("");

  /* ─── Auth listener ──────────────────────────────────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(adminAuth, async (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        try {
          const snap = await getDoc(doc(adminDb, "admins", u.uid));
          setAdminOk(snap.exists() && snap.data()?.active !== false);
        } catch { setAdminOk(false); }
        setAdminCheckDone(true);
      } else {
        setAdminOk(false);
        setAdminCheckDone(true);
      }
    });
    return unsub;
  }, []);

  /* ─── Firestore listeners ────────────────────────────────── */
  // Products — re-attach docId after normalization so toggle/edit/delete work
  useEffect(() => {
    if (!BYPASS_AUTH && !adminOk) return;
    const unsub = onSnapshot(collection(adminDb, "catalog"), (snap) => {
      const raw = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
      const base = raw.length ? raw : DEFAULT_PRODUCTS;
      setProducts(attachDocIds(normalizeProductList(base), raw));
    });
    return unsub;
  }, [adminOk]);

  // Orders
  useEffect(() => {
    if (!BYPASS_AUTH && !adminOk) return;
    const q = query(collection(adminDb, "orders"), orderBy("createdAt", "desc"), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [adminOk]);

  // Stock requests
  useEffect(() => {
    if (!BYPASS_AUTH && !adminOk) return;
    const unsub = onSnapshot(collection(adminDb, "stockRequests"), (snap) => {
      setStockRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [adminOk]);

  // Promo codes
  useEffect(() => {
    if (!BYPASS_AUTH && !adminOk) return;
    const unsub = onSnapshot(collection(adminDb, "promoCodes"), (snap) => {
      setPromoCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [adminOk]);

  /* ─── Auth: login ────────────────────────────────────────── */
  const loginEmail = useCallback(async () => {
    setBusy(true); setMsg("");
    try {
      await signInWithEmailAndPassword(adminAuth, email.trim(), password);
    } catch (e) { setMsg(e?.message || "Login failed. Check your credentials."); }
    finally { setBusy(false); }
  }, [email, password]);

  /* ─── Auth: register ─────────────────────────────────────── 
     AdminLogin calls: onCreateAccount({ name, email, password, secretKey })
     We validate secretKey here before creating the account.   */
  const createAdminAccount = useCallback(async ({ name, email: regEmail, password: regPass, secretKey }) => {
    if (secretKey !== ADMIN_SECRET_KEY) {
      throw new Error("Invalid admin secret key. Contact the site owner.");
    }
    setBusy(true); setMsg("");
    try {
      const { user: u } = await createUserWithEmailAndPassword(adminAuth, regEmail.trim(), regPass);
      if (name?.trim()) await updateProfile(u, { displayName: name.trim() });
      await setDoc(doc(adminDb, "admins", u.uid), {
        email: u.email, displayName: name?.trim() || "",
        active: true, createdAt: serverTimestamp(),
      });
    } catch (e) {
      setBusy(false);
      throw e; // re-throw so AdminLogin can display the error
    }
    setBusy(false);
  }, []);

  /* ─── Auth: logout ───────────────────────────────────────── */
  const logout = useCallback(async () => {
    try { await signOut(adminAuth); } catch {}
    setUser(null); setAdminOk(false); setAdminCheckDone(false);
  }, []);

  /* ─── Customer loader ────────────────────────────────────── */
  const loadCustomers = useCallback(async () => {
    if (!BYPASS_AUTH && !adminOk) return;
    setBusy(true); setMsg("");
    try {
      // Reads from the "users" Firestore collection.
      // Make sure your Firestore rules allow admins to read this:
      //   match /users/{uid} { allow read: if request.auth != null
      //     && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.active == true; }
      const snap = await getDocs(query(collection(adminDb, "users"), limit(200)));
      setCustomers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
      setCustomersLoaded(true);
      setMsg(snap.size > 0 ? `✓ ${snap.size} customers loaded` : "✓ No customers found in /users collection yet.");
    } catch (e) {
      if (e?.code === "permission-denied") {
        setMsg("Permission denied — update your Firestore rules to allow admin reads on the 'users' collection. See AdminApp.jsx comments.");
      } else {
        setMsg(e?.message || "Could not load customers.");
      }
    }
    finally { setBusy(false); }
  }, [adminOk]);

  /* ─── Product handlers ───────────────────────────────────── */
  const handleProductSave = useCallback(async (productOrList, mode) => {
    if (!BYPASS_AUTH && !adminOk) return;
    setBusy(true); setMsg("");
    try {
      if (mode === "bulk") {
        const err = validateProductList(productOrList);
        if (err) { setMsg(err); return; }
        // Delete all existing catalog docs then add new ones
        const existing = await getDocs(collection(adminDb, "catalog"));
        await Promise.all(existing.docs.map(d => deleteDoc(d.ref)));
        await Promise.all(
          productOrList.map(p => addDoc(collection(adminDb, "catalog"), { ...p, updatedAt: serverTimestamp() }))
        );
        setMsg(`✓ ${productOrList.length} products uploaded`);
      } else if (mode === "edit") {
        const p = productOrList;
        if (!p.docId) { setMsg("Cannot edit: product has no Firestore ID (docId missing)."); return; }
        await updateDoc(doc(adminDb, "catalog", p.docId), { ...p, updatedAt: serverTimestamp() });
        setMsg(`✓ "${p.name}" updated`);
      } else {
        // add
        const p = productOrList;
        await addDoc(collection(adminDb, "catalog"), { ...normalizeProduct(p), updatedAt: serverTimestamp() });
        setMsg(`✓ "${p.name}" added`);
      }
    } catch (e) { setMsg(e?.message || "Could not save product."); }
    finally { setBusy(false); }
  }, [adminOk]);

  const handleProductDelete = useCallback(async (id) => {
    if (!BYPASS_AUTH && !adminOk) return;
    const product = products.find(p => Number(p.id) === Number(id));
    if (!product?.docId) { setMsg("Cannot delete: product has no Firestore ID."); return; }
    setBusy(true); setMsg("");
    try {
      await deleteDoc(doc(adminDb, "catalog", product.docId));
      setMsg("✓ Product deleted");
    } catch (e) { setMsg(e?.message || "Could not delete product."); }
    finally { setBusy(false); }
  }, [adminOk, products]);

  /* ─── Stock toggle ───────────────────────────────────────── 
     currentStock = p.inStock value (true | false | undefined)
     undefined means "not set" → treat as in-stock → toggle to false */
  const handleToggleStock = useCallback(async (id, currentStock) => {
    if (!BYPASS_AUTH && !adminOk) return;
    const product = products.find(p => Number(p.id) === Number(id));
    if (!product?.docId) { setMsg("Cannot update stock: product has no Firestore ID."); return; }
    setBusy(true);
    try {
      const newStock = currentStock === false; // false→true, true/undefined→false
      await updateDoc(doc(adminDb, "catalog", product.docId), { inStock: newStock });
    } catch (e) { setMsg(e?.message || "Could not update stock."); }
    finally { setBusy(false); }
  }, [adminOk, products]);

  /* ─── Order handlers ─────────────────────────────────────── */
  const handleOrderReload = useCallback(async () => {
    if (!BYPASS_AUTH && !adminOk) return;
    setBusy(true); setMsg("");
    try {
      const q    = query(collection(adminDb, "orders"), orderBy("createdAt", "desc"), limit(200));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMsg(`✓ ${snap.size} orders loaded`);
    } catch (e) { setMsg(e?.message || "Could not reload orders."); }
    finally { setBusy(false); }
  }, [adminOk]);

  const handleOrderStatusChange = useCallback(async (orderId, newStatus) => {
    setBusy(true);
    try {
      await updateDoc(doc(adminDb, "orders", orderId), { status: newStatus, updatedAt: serverTimestamp() });
    } catch (e) { setMsg(e?.message || "Could not update order status."); }
    finally { setBusy(false); }
  }, []);

  /* ─── Stock-request handler ──────────────────────────────── */
  const handleFulfillStockRequest = useCallback(async (requestId, productId, userId, productName) => {
    setBusy(true); setMsg("");
    try {
      await updateDoc(doc(adminDb, "stockRequests", requestId), {
        status: "fulfilled", fulfilledAt: serverTimestamp(),
      });
      if (userId) {
        await addDoc(collection(adminDb, "users", userId, "notifications"), {
          type: "restock", productId, productName,
          message: `Great news! "${productName}" is back in stock.`,
          read: false, createdAt: serverTimestamp(),
        });
      }
      setMsg(`✓ Customer notified for "${productName}"`);
    } catch (e) { setMsg(e?.message || "Could not fulfill request."); }
    finally { setBusy(false); }
  }, []);

  /* ─── Promo-code handlers ────────────────────────────────── */
  const handleSavePromoCode = useCallback(async ({ code, discount, active }) => {
    if (!code?.trim()) return;
    setBusy(true); setMsg("");
    try {
      const key = code.trim().toUpperCase();
      await setDoc(doc(adminDb, "promoCodes", key), {
        code: key, discount: Number(discount), active: Boolean(active),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setMsg(`✓ Promo code "${key}" saved`);
    } catch (e) { setMsg(e?.message || "Could not save promo code."); }
    finally { setBusy(false); }
  }, []);

  const handleDeletePromoCode = useCallback(async (id) => {
    if (!window.confirm(`Delete promo code "${id}"?`)) return;
    setBusy(true); setMsg("");
    try {
      await deleteDoc(doc(adminDb, "promoCodes", id));
      setMsg(`✓ Promo code "${id}" deleted`);
    } catch (e) { setMsg(e?.message || "Could not delete promo code."); }
    finally { setBusy(false); }
  }, []);

  const handleTogglePromoCode = useCallback(async (id, currentActive) => {
    setBusy(true); setMsg("");
    try {
      await updateDoc(doc(adminDb, "promoCodes", id), { active: !currentActive });
      setMsg(`✓ Promo code "${id}" ${!currentActive ? "activated" : "deactivated"}`);
    } catch (e) { setMsg(e?.message || "Could not update promo code."); }
    finally { setBusy(false); }
  }, []);

  /* ─── Auth guards ────────────────────────────────────────── */
  if (!BYPASS_AUTH && !authReady)                     return <LoadingScreen text="Loading…" />;
  if (!BYPASS_AUTH && authReady && !adminCheckDone)   return <LoadingScreen text="Checking admin access…" />;
  if (!BYPASS_AUTH && !user)                          return (
    <AdminLogin
      storefrontUrl={storefrontUrl} busy={busy} msg={msg} setMsg={setMsg}
      email={email} password={password} setEmail={setEmail} setPassword={setPassword}
      onLogin={loginEmail} onCreateAccount={createAdminAccount}
    />
  );
  if (!BYPASS_AUTH && adminCheckDone && !adminOk)     return (
    <AccessDenied user={user} storefrontUrl={storefrontUrl} onLogout={logout} />
  );

  /* ─── Nav items ──────────────────────────────────────────── */
  const navItems = [
    { id: "dashboard",     label: "Overview",       icon: "◈" },
    { id: "products",      label: "Products",       icon: "⟨⟩" },
    { id: "orders",        label: "Orders",         icon: "◻" },
    { id: "customers",     label: "Customers",      icon: "◉" },
    { id: "stockRequests", label: "Stock Requests", icon: "◌",
      badge: stockRequests.filter(r => r.status !== "fulfilled").length },
    { id: "promoCodes",    label: "Promo Codes",    icon: "🏷" },
  ];

  /* ─── Layout ─────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: font.sans, display: "flex", flexDirection: "column" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:3px}
        textarea:focus,input:focus,select:focus{outline:none!important}
        input::placeholder,textarea::placeholder{color:${C.muted}}
        select option{background:#141310;color:#F5F0E8}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:640px){.adm-sidebar{display:none!important}.adm-main-pad{padding:20px 16px!important}}
      `}</style>

      {/* Top bar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 64, background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.gold, fontSize: 15 }}>✦</span>
          <span style={{ fontSize: 18, fontWeight: 400, fontFamily: font.serif, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gold }}>
            Sanj<span style={{ color: C.gold }}>iiiii</span>
          </span>
          <span style={{ color: C.border2, margin: "0 4px" }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <a href={storefrontUrl} target="_blank" rel="noreferrer"
            style={{ fontSize: 14, fontWeight: 700, color: C.gold, textDecoration: "none" }}>
            View store ↗
          </a>
          <button type="button" onClick={logout} style={{ ...S.btnGhost, padding: "6px 14px", fontSize: 11 }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <aside className="adm-sidebar" style={{ width: 250, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <nav style={{ padding: "20px 0", flex: 1 }}>
            {navItems.map(n => (
              <NavBtn key={n.id} {...n} active={tab === n.id} onClick={id => { setTab(id); setMsg(""); }} />
            ))}
          </nav>
          <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.goldBg, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.gold, fontWeight: 700, flexShrink: 0 }}>
              {(user?.email?.[0] || "A").toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email || "Admin"}
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 2 }}>Admin</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="adm-main-pad" style={{ flex: 1, overflowY: "auto", padding: "44px 56px" }}>
          {tab === "dashboard"     && <DashboardPage     products={products} customers={customers} customersLoaded={customersLoaded} orders={orders} />}
          {tab === "products"      && <ProductsPage      products={products} onSave={handleProductSave} onDelete={handleProductDelete} onToggleStock={handleToggleStock} busy={busy} msg={msg} setMsg={setMsg} />}
          {tab === "orders"        && <OrdersPage        orders={orders} onStatusChange={handleOrderStatusChange} onReload={handleOrderReload} busy={busy} />}
          {tab === "customers"     && <CustomersPage     customers={customers} customersLoaded={customersLoaded} onLoad={loadCustomers} busy={busy} msg={msg} setMsg={setMsg} />}
          {tab === "stockRequests" && <StockRequestsPage requests={stockRequests} onFulfill={handleFulfillStockRequest} busy={busy} msg={msg} setMsg={setMsg} />}
          {tab === "promoCodes"    && <PromoCodesPage    codes={promoCodes} onSave={handleSavePromoCode} onDelete={handleDeletePromoCode} onToggle={handleTogglePromoCode} busy={busy} msg={msg} setMsg={setMsg} />}
        </main>
      </div>

      {/* Mobile nav */}
      <nav className="adm-mobile-nav" aria-label="Admin sections">
        {navItems.map(n => (
          <button key={n.id} type="button" className={tab === n.id ? "active" : ""}
            onClick={() => { setTab(n.id); setMsg(""); }}>
            <span aria-hidden>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
