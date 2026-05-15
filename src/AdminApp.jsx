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
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import * as XLSX from "xlsx";
import { auth, db, storage } from "./firebase.js";
import { DEFAULT_PRODUCTS } from "./data/catalog.js";

const themeCss = `
  :root {
    --admin-bg: #f6f7fb;
    --admin-surface: #ffffff;
    --admin-border: #e7e9f3;
    --admin-text: #13172b;
    --admin-muted: #5f6787;
    --admin-accent: #1a8cff;
    --admin-accent-soft: #ebf5ff;
    --admin-danger: #e03e51;
    --admin-shadow: 0 14px 42px rgba(20, 33, 61, 0.08);
  }
  body { margin: 0; font-family: "Plus Jakarta Sans", "Segoe UI", sans-serif; background: radial-gradient(circle at top right, #ecf4ff 0%, var(--admin-bg) 40%); color: var(--admin-text); }
  .admin-shell * { box-sizing: border-box; }
  .admin-shell { min-height: 100vh; color: var(--admin-text); }
  .admin-login-wrap { min-height: 100vh; display: grid; place-items: center; padding: 20px; }
  .admin-login-card { width: min(460px, 100%); background: var(--admin-surface); border: 1px solid var(--admin-border); border-radius: 22px; box-shadow: var(--admin-shadow); padding: 32px; }
  .admin-kicker { font-size: 12px; text-transform: uppercase; letter-spacing: .15em; color: var(--admin-accent); font-weight: 700; }
  .admin-title { font-size: 30px; margin: 8px 0 8px; }
  .admin-subtitle { font-size: 14px; color: var(--admin-muted); margin: 0 0 24px; }
  .admin-input, .admin-select, .admin-textarea { width: 100%; border: 1px solid var(--admin-border); border-radius: 12px; padding: 11px 13px; font-size: 14px; background: #fff; color: var(--admin-text); }
  .admin-textarea { min-height: 92px; resize: vertical; }
  .admin-input:focus, .admin-select:focus, .admin-textarea:focus { outline: none; border-color: var(--admin-accent); box-shadow: 0 0 0 3px rgba(26, 140, 255, .14); }
  .admin-btn { border: 0; border-radius: 12px; padding: 10px 14px; font-weight: 700; cursor: pointer; background: var(--admin-accent); color: #fff; }
  .admin-btn:disabled { opacity: .55; cursor: wait; }
  .admin-btn.soft { background: var(--admin-accent-soft); color: var(--admin-accent); }
  .admin-btn.ghost { background: #fff; border: 1px solid var(--admin-border); color: var(--admin-text); }
  .admin-btn.danger { background: #fff1f3; color: var(--admin-danger); }
  .admin-link { color: var(--admin-accent); text-decoration: none; font-weight: 600; }
  .admin-app { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
  .admin-side { background: #fff; border-right: 1px solid var(--admin-border); padding: 18px; }
  .admin-brand { font-weight: 800; letter-spacing: .05em; font-size: 17px; margin: 2px 0 18px; }
  .admin-nav button { display: block; width: 100%; text-align: left; border: 0; border-radius: 12px; background: transparent; color: var(--admin-muted); padding: 10px 12px; margin-bottom: 6px; font-weight: 600; cursor: pointer; }
  .admin-nav button.active { background: var(--admin-accent-soft); color: var(--admin-accent); }
  .admin-main { padding: 18px; }
  .admin-topbar { background: #fff; border: 1px solid var(--admin-border); border-radius: 18px; box-shadow: var(--admin-shadow); display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 16px; margin-bottom: 14px; }
  .admin-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
  .metric { border: 1px solid var(--admin-border); border-radius: 16px; padding: 16px; background: #fff; box-shadow: var(--admin-shadow); }
  .metric .label { font-size: 12px; color: var(--admin-muted); margin-bottom: 8px; }
  .metric .value { font-size: 32px; font-weight: 800; }
  .panel { border: 1px solid var(--admin-border); border-radius: 16px; background: #fff; box-shadow: var(--admin-shadow); padding: 16px; }
  .row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .row3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
  .table-wrap { overflow: auto; border: 1px solid var(--admin-border); border-radius: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 11px; border-bottom: 1px solid var(--admin-border); text-align: left; }
  th { font-size: 12px; color: var(--admin-muted); text-transform: uppercase; letter-spacing: .06em; background: #fbfcff; }
  .tag { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #eef3ff; color: #28468f; }
  .tag.pending { background: #fff5df; color: #926508; }
  .tag.completed { background: #e7f9ee; color: #18763f; }
  .tag.due { background: #ffecf0; color: #972040; }
  .thumb { width: 52px; height: 52px; object-fit: cover; border-radius: 10px; border: 1px solid var(--admin-border); }
  .alert { border: 1px solid var(--admin-border); border-radius: 12px; background: #fff; padding: 10px 12px; margin-bottom: 12px; font-size: 13px; }
  @media (max-width: 1024px) {
    .admin-app { grid-template-columns: 1fr; }
    .admin-side { border-right: 0; border-bottom: 1px solid var(--admin-border); }
  }
  @media (max-width: 760px) {
    .row, .row3 { grid-template-columns: 1fr; }
    .admin-topbar { flex-direction: column; align-items: flex-start; }
  }
`;

const emptyProduct = {
  id: "",
  name: "",
  brand: "",
  price: "",
  category: "Women",
  badge: "",
  emoji: "???",
  sizes: "XS,S,M,L",
  bg1: "#E9F4FF",
  bg2: "#D7E8FF",
  desc: "",
  image: "",
};

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const catHints = [
  { name: "Women", keys: ["women", "woman", "ladies", "female", "girl"] },
  { name: "Men", keys: ["men", "man", "male", "gent", "boy"] },
  { name: "Children", keys: ["kid", "kids", "child", "children", "baby", "toddler"] },
  { name: "Accessories", keys: ["accessory", "bag", "belt", "wallet", "watch", "jewelry", "jewellery"] },
];

const normalizeText = (value) => String(value || "").trim();

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const detectCategory = (row) => {
  const explicit = normalizeText(row.category);
  if (explicit) return explicit;
  const probe = `${row.name || ""} ${row.brand || ""} ${row.desc || ""}`.toLowerCase();
  for (const hint of catHints) {
    if (hint.keys.some((k) => probe.includes(k))) return hint.name;
  }
  return "General";
};

const parseSizes = (value) => {
  const txt = normalizeText(value);
  if (!txt) return ["Free Size"];
  return txt.split(",").map((s) => s.trim()).filter(Boolean);
};

const parseBg = (value, fallback1, fallback2) => {
  const txt = normalizeText(value);
  if (!txt) return [fallback1, fallback2];
  const arr = txt.split(",").map((x) => x.trim()).filter(Boolean);
  return [arr[0] || fallback1, arr[1] || fallback2];
};

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [adminOk, setAdminOk] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editProductId, setEditProductId] = useState(null);
  const [productQuery, setProductQuery] = useState("");
  const [excelPreview, setExcelPreview] = useState([]);
  const [orderQuery, setOrderQuery] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const storefrontUrl = useMemo(() => {
    const u = new URL(window.location.href);
    u.pathname = u.pathname.replace(/\/admin\.html$/i, "/");
    u.hash = "";
    return u.origin + "/";
  }, []);

  useEffect(() => {
    document.title = "Admin Panel · sanjiiiii";
    const id = "admin-premium-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = themeCss;
    document.head.appendChild(style);
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
      return;
    }
    let canceled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "admins", user.uid));
        const ok = snap.exists() && snap.data()?.active === true;
        if (!canceled) {
          setAdminOk(ok);
          setAdminCheckDone(true);
        }
      } catch {
        if (!canceled) {
          setAdminOk(false);
          setAdminCheckDone(true);
        }
      }
    })();
    return () => { canceled = true; };
  }, [user]);

  useEffect(() => {
    if (!adminOk) return undefined;
    const unsub = onSnapshot(doc(db, "catalog", "store"), (snap) => {
      const live = snap.data()?.products;
      setProducts(Array.isArray(live) && live.length ? live : DEFAULT_PRODUCTS);
    });
    return () => unsub();
  }, [adminOk]);

  const syncUsersAndOrders = useCallback(async () => {
    const q = query(collection(db, "users"), limit(200));
    const snap = await getDocs(q);
    const customerRows = [];
    const orderRows = [];
    snap.docs.forEach((d) => {
      const x = d.data() || {};
      const list = Array.isArray(x.orders) ? x.orders : [];
      customerRows.push({
        uid: d.id,
        email: x.email || "—",
        name: x.name || "—",
        orders: list.length,
      });
      list.forEach((o) => {
        orderRows.push({
          uid: d.id,
          email: x.email || "—",
          customer: o?.delivery?.fullName || x.name || "Unknown",
          orderId: o?.id || "—",
          total: Number(o?.total || 0),
          status: o?.payment?.status || "pending",
          createdAt: o?.createdAt || "",
        });
      });
    });
    customerRows.sort((a, b) => b.orders - a.orders);
    orderRows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    setCustomers(customerRows);
    setOrders(orderRows);
  }, []);

  useEffect(() => {
    if (!adminOk) return;
    syncUsersAndOrders().catch(() => void 0);
  }, [adminOk, syncUsersAndOrders]);

  const loginEmail = async () => {
    setBusy(true);
    setMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setMsg("Invalid email or password.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await signOut(auth).catch(() => void 0);
  };

  const saveProducts = async (nextProducts, successText) => {
    setBusy(true);
    setMsg("");
    try {
      await setDoc(
        doc(db, "catalog", "store"),
        {
          products: nextProducts,
          updatedAt: serverTimestamp(),
          updatedBy: user?.email || user?.uid || null,
        },
        { merge: true },
      );
      setProducts(nextProducts);
      setMsg(successText);
    } catch (e) {
      setMsg(e?.message || "Save failed. Check Firestore rules.");
    } finally {
      setBusy(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const fileRef = ref(storage, `admin-products/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setProductForm((prev) => ({ ...prev, image: url }));
      setMsg("Image uploaded successfully.");
    } catch (e) {
      setMsg(e?.message || "Image upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const upsertProduct = async () => {
    const id = Number(productForm.id);
    const price = Number(productForm.price);
    if (!id || !productForm.name.trim() || !productForm.brand.trim() || !price) {
      setMsg("Product id, name, brand, and price are required.");
      return;
    }
    const next = {
      id,
      name: productForm.name.trim(),
      brand: productForm.brand.trim(),
      price,
      category: productForm.category.trim() || "General",
      badge: productForm.badge.trim() || null,
      emoji: productForm.emoji.trim() || "???",
      sizes: productForm.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      bg: [productForm.bg1.trim() || "#E9F4FF", productForm.bg2.trim() || "#D7E8FF"],
      desc: productForm.desc.trim() || "No description.",
      image: productForm.image.trim() || null,
    };
    const exists = products.some((p) => p.id === id);
    if (!editProductId && exists) {
      setMsg("This product id already exists. Use edit or a different id.");
      return;
    }
    const nextProducts = editProductId
      ? products.map((p) => (p.id === editProductId ? next : p))
      : [...products, next].sort((a, b) => a.id - b.id);
    await saveProducts(nextProducts, editProductId ? "Product updated." : "Product added.");
    setProductForm(emptyProduct);
    setEditProductId(null);
  };

  const parseExcelProducts = async (file) => {
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        setMsg("Excel sheet পাওয়া যায়নি।");
        return;
      }
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
      if (!rows.length) {
        setMsg("Excel file empty.");
        return;
      }

      const mapped = rows
        .map((r, idx) => {
          const raw = Object.fromEntries(
            Object.entries(r).map(([k, v]) => [String(k).trim().toLowerCase(), v]),
          );
          const id = toNumber(raw.id || raw.productid || raw.product_id || 0, 0);
          const price = toNumber(raw.price || raw.amount || raw.rate || 0, 0);
          const name = normalizeText(raw.name || raw.product || raw.title);
          const brand = normalizeText(raw.brand || raw.label || "Generic");
          if (!id || !name || !price) return null;
          const desc = normalizeText(raw.desc || raw.description || raw.details || "No description.");
          const category = detectCategory({ name, brand, desc, category: raw.category });
          const bg = parseBg(raw.bg || raw.background || "", "#E9F4FF", "#D7E8FF");
          const next = {
            id,
            name,
            brand,
            price,
            category,
            badge: normalizeText(raw.badge) || null,
            emoji: normalizeText(raw.emoji) || "🛍️",
            sizes: parseSizes(raw.sizes || raw.size || ""),
            bg,
            desc,
            image: normalizeText(raw.image || raw.imageurl || raw.image_url || raw.photo) || null,
            _row: idx + 2,
          };
          return next;
        })
        .filter(Boolean);

      if (!mapped.length) {
        setMsg("Valid rows পাওয়া যায়নি। Required: id, name, price.");
        return;
      }
      setExcelPreview(mapped);
      setMsg(`${mapped.length}টা product Excel থেকে parsed হয়েছে। Preview দেখে import দিন।`);
    } catch (e) {
      setMsg(e?.message || "Excel parse failed.");
    } finally {
      setBusy(false);
    }
  };

  const importExcelProducts = async () => {
    if (!excelPreview.length) {
      setMsg("Excel preview empty.");
      return;
    }
    const byId = new Map(products.map((p) => [p.id, p]));
    excelPreview.forEach((p) => {
      const { _row, ...clean } = p;
      byId.set(clean.id, clean);
    });
    const merged = Array.from(byId.values()).sort((a, b) => a.id - b.id);
    await saveProducts(merged, `${excelPreview.length}টা product imported হয়েছে (existing ID auto updated)।`);
    setExcelPreview([]);
  };

  const removeProduct = async (id) => {
    const nextProducts = products.filter((p) => p.id !== id);
    await saveProducts(nextProducts, "Product deleted.");
  };

  const editProduct = (p) => {
    setEditProductId(p.id);
    setProductForm({
      id: String(p.id),
      name: p.name || "",
      brand: p.brand || "",
      price: String(p.price || ""),
      category: p.category || "",
      badge: p.badge || "",
      emoji: p.emoji || "???",
      sizes: Array.isArray(p.sizes) ? p.sizes.join(",") : "",
      bg1: Array.isArray(p.bg) ? p.bg[0] || "" : "",
      bg2: Array.isArray(p.bg) ? p.bg[1] || "" : "",
      desc: p.desc || "",
      image: p.image || "",
    });
    setTab("products");
  };

  const updateOrderStatus = async (row, nextStatus) => {
    setBusy(true);
    setMsg("");
    try {
      const userRef = doc(db, "users", row.uid);
      const snap = await getDoc(userRef);
      const data = snap.data() || {};
      const current = Array.isArray(data.orders) ? data.orders : [];
      const updated = current.map((o) => {
        if ((o?.id || "") !== row.orderId) return o;
        return {
          ...o,
          payment: {
            ...(o?.payment || {}),
            status: nextStatus,
          },
        };
      });
      await updateDoc(userRef, { orders: updated, updatedAt: serverTimestamp() });
      await syncUsersAndOrders();
      setMsg(`Order ${row.orderId} marked as ${nextStatus}.`);
    } catch (e) {
      setMsg(e?.message || "Order update failed.");
    } finally {
      setBusy(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = productQuery.toLowerCase().trim();
    if (!term) return true;
    return [p.name, p.brand, p.category, String(p.id)].some((v) => String(v || "").toLowerCase().includes(term));
  });

  const filteredOrders = orders.filter((o) => {
    const term = orderQuery.toLowerCase().trim();
    if (!term) return true;
    return [o.orderId, o.customer, o.email, o.status].some((v) => String(v || "").toLowerCase().includes(term));
  });

  const filteredCustomers = customers.filter((c) => {
    const term = customerQuery.toLowerCase().trim();
    if (!term) return true;
    return [c.email, c.name, c.uid].some((v) => String(v || "").toLowerCase().includes(term));
  });

  if (!authReady) {
    return <div className="admin-shell admin-login-wrap">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="admin-shell admin-login-wrap">
        <div className="admin-login-card">
          <div className="admin-kicker">sanjiiiii admin</div>
          <h1 className="admin-title">Control Panel</h1>
          <p className="admin-subtitle">Secure login for catalog, orders, and customers.</p>
          {msg && <div className="alert">{msg}</div>}
          <div style={{ display: "grid", gap: 10 }}>
            <input className="admin-input" type="email" placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="admin-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="admin-btn" type="button" onClick={loginEmail} disabled={busy}>{busy ? "Signing in..." : "Sign In"}</button>
            <a href={storefrontUrl} className="admin-link">Back to storefront</a>
          </div>
        </div>
      </div>
    );
  }

  if (adminCheckDone && !adminOk) {
    return (
      <div className="admin-shell admin-login-wrap">
        <div className="admin-login-card">
          <h2 style={{ marginTop: 0 }}>Access denied</h2>
          <p style={{ color: "var(--admin-muted)", lineHeight: 1.6 }}>
            Add this document in Firestore: <code>admins/{user.uid}</code> with field <code>active: true</code>.
          </p>
          <p style={{ color: "var(--admin-muted)", lineHeight: 1.6 }}>
            Then deploy updated rules from <code>firestore.rules</code>.
          </p>
          <button type="button" className="admin-btn ghost" onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  }

  if (!adminCheckDone) {
    return <div className="admin-shell admin-login-wrap">Checking admin access...</div>;
  }

  return (
    <div className="admin-shell">
      <div className="admin-app">
        <aside className="admin-side">
          <div className="admin-brand">SANJIIIII ADMIN</div>
          <div className="admin-nav">
            {[
              ["dashboard", "Dashboard"],
              ["products", "Product CRUD"],
              ["orders", "Order Management"],
              ["customers", "Customers"],
            ].map(([id, label]) => (
              <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
        </aside>

        <main className="admin-main">
          <header className="admin-topbar">
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Premium Admin Panel</div>
              <div style={{ color: "var(--admin-muted)", fontSize: 13 }}>{user.email}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href={storefrontUrl} target="_blank" rel="noreferrer" className="admin-link">View Store</a>
              <button type="button" className="admin-btn ghost" onClick={syncUsersAndOrders}>Refresh Data</button>
              <button type="button" className="admin-btn ghost" onClick={logout}>Sign Out</button>
            </div>
          </header>

          {msg && <div className="alert">{msg}</div>}

          {tab === "dashboard" && (
            <>
              <div className="admin-grid" style={{ marginBottom: 12 }}>
                <div className="metric"><div className="label">Total Products</div><div className="value">{products.length}</div></div>
                <div className="metric"><div className="label">Customers</div><div className="value">{customers.length}</div></div>
                <div className="metric"><div className="label">Orders</div><div className="value">{orders.length}</div></div>
                <div className="metric"><div className="label">Revenue (All)</div><div className="value">{money(orders.reduce((sum, o) => sum + Number(o.total || 0), 0))}</div></div>
              </div>
              <div className="panel">
                <h3 style={{ marginTop: 0 }}>System Checklist</h3>
                <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
                  Admin Login, Role-based Access, Firebase Rules, Product CRUD, Order Management, Image Upload, Search/Filter, and Responsive Design are enabled in this panel.
                </p>
              </div>
            </>
          )}

          {tab === "products" && (
            <>
              <div className="panel" style={{ marginBottom: 12 }}>
                <h3 style={{ marginTop: 0 }}>{editProductId ? `Edit Product #${editProductId}` : "Add New Product"}</h3>
                <div className="row3">
                  <input className="admin-input" placeholder="ID (number)" value={productForm.id} onChange={(e) => setProductForm((p) => ({ ...p, id: e.target.value }))} />
                  <input className="admin-input" placeholder="Name" value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} />
                  <input className="admin-input" placeholder="Brand" value={productForm.brand} onChange={(e) => setProductForm((p) => ({ ...p, brand: e.target.value }))} />
                </div>
                <div className="row3" style={{ marginTop: 10 }}>
                  <input className="admin-input" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} />
                  <input className="admin-input" placeholder="Category" value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} />
                  <input className="admin-input" placeholder="Badge (optional)" value={productForm.badge} onChange={(e) => setProductForm((p) => ({ ...p, badge: e.target.value }))} />
                </div>
                <div className="row3" style={{ marginTop: 10 }}>
                  <input className="admin-input" placeholder="Emoji" value={productForm.emoji} onChange={(e) => setProductForm((p) => ({ ...p, emoji: e.target.value }))} />
                  <input className="admin-input" placeholder="Sizes: XS,S,M,L" value={productForm.sizes} onChange={(e) => setProductForm((p) => ({ ...p, sizes: e.target.value }))} />
                  <input className="admin-input" placeholder="Image URL" value={productForm.image} onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))} />
                </div>
                <div className="row" style={{ marginTop: 10 }}>
                  <input className="admin-input" placeholder="Background color 1" value={productForm.bg1} onChange={(e) => setProductForm((p) => ({ ...p, bg1: e.target.value }))} />
                  <input className="admin-input" placeholder="Background color 2" value={productForm.bg2} onChange={(e) => setProductForm((p) => ({ ...p, bg2: e.target.value }))} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <textarea className="admin-textarea" placeholder="Description" value={productForm.desc} onChange={(e) => setProductForm((p) => ({ ...p, desc: e.target.value }))} />
                </div>
                <div className="toolbar" style={{ marginTop: 10 }}>
                  <input type="file" accept="image/*" onChange={(e) => void handleImageUpload(e.target.files?.[0])} />
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => void parseExcelProducts(e.target.files?.[0])} />
                  <button type="button" className="admin-btn" onClick={upsertProduct} disabled={busy}>{editProductId ? "Update Product" : "Add Product"}</button>
                  <button type="button" className="admin-btn soft" onClick={importExcelProducts} disabled={busy || !excelPreview.length}>Import Excel Products</button>
                  <button type="button" className="admin-btn ghost" onClick={() => { setEditProductId(null); setProductForm(emptyProduct); }}>Reset</button>
                </div>
                <div style={{ color: "var(--admin-muted)", fontSize: 12 }}>
                  Excel columns supported: `id`, `name`, `brand`, `price`, `category`, `sizes`, `badge`, `emoji`, `bg`, `desc`, `image`.
                </div>
              </div>

              {excelPreview.length > 0 && (
                <div className="panel" style={{ marginBottom: 12 }}>
                  <h3 style={{ marginTop: 0 }}>Excel Preview ({excelPreview.length})</h3>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Row</th><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Sizes</th></tr></thead>
                      <tbody>
                        {excelPreview.slice(0, 120).map((p) => (
                          <tr key={`${p.id}-${p._row}`}>
                            <td>{p._row}</td>
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td>{p.category}</td>
                            <td>{money(p.price)}</td>
                            <td>{Array.isArray(p.sizes) ? p.sizes.join(", ") : ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="panel">
                <div className="toolbar">
                  <input className="admin-input" placeholder="Search by name, brand, id, category" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id}>
                          <td>{p.image ? <img className="thumb" src={p.image} alt={p.name} /> : <span>{p.emoji || "???"}</span>}</td>
                          <td><strong>{p.name}</strong><br /><span style={{ color: "var(--admin-muted)", fontSize: 12 }}>{p.brand} · #{p.id}</span></td>
                          <td>{p.category}</td>
                          <td>{money(p.price)}</td>
                          <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button type="button" className="admin-btn soft" onClick={() => editProduct(p)}>Edit</button>
                            <button type="button" className="admin-btn danger" onClick={() => void removeProduct(p.id)} disabled={busy}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === "orders" && (
            <div className="panel">
              <div className="toolbar">
                <input className="admin-input" placeholder="Search order id, customer, email, status" value={orderQuery} onChange={(e) => setOrderQuery(e.target.value)} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={`${o.uid}-${o.orderId}`}>
                        <td>{o.orderId}<br /><span style={{ color: "var(--admin-muted)", fontSize: 12 }}>{o.email}</span></td>
                        <td>{o.customer}</td>
                        <td>{money(o.total)}</td>
                        <td><span className={`tag ${String(o.status).toLowerCase()}`}>{o.status}</span></td>
                        <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button type="button" className="admin-btn soft" onClick={() => void updateOrderStatus(o, "completed")} disabled={busy}>Mark Completed</button>
                          <button type="button" className="admin-btn danger" onClick={() => void updateOrderStatus(o, "due")} disabled={busy}>Mark Due</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "customers" && (
            <div className="panel">
              <div className="toolbar">
                <input className="admin-input" placeholder="Search customer by name, email, uid" value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>UID</th></tr></thead>
                  <tbody>
                    {filteredCustomers.map((c) => (
                      <tr key={c.uid}>
                        <td>{c.name}</td>
                        <td>{c.email}</td>
                        <td>{c.orders}</td>
                        <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}>{c.uid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

