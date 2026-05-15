import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import * as XLSX from "xlsx";
import { auth, db, storage } from "./firebase.js";

const C = {
  bg: "#0f1115",
  panel: "#171a21",
  panel2: "#1f2330",
  border: "#2b3245",
  text: "#eff2f8",
  muted: "#9ba4be",
  brand: "#7ac5ff",
  ok: "#4ac18e",
  err: "#ff7f8a",
};

const baseInput = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: C.panel2,
  color: C.text,
  fontSize: 13,
};

const CATEGORIES = ["Women", "Men", "Accessories", "Kids"];

function inferCategory(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (!value) return "Accessories";
  if (value.includes("women") || value.includes("female") || value.includes("ladies")) return "Women";
  if (value.includes("men") || value.includes("male") || value.includes("gent")) return "Men";
  if (value.includes("kid") || value.includes("child") || value.includes("baby")) return "Kids";
  if (value.includes("access") || value.includes("bag") || value.includes("jewel") || value.includes("belt")) return "Accessories";
  return "Accessories";
}

function parseRow(row, index, fallbackCategory = "Accessories") {
  const id = Number(row.id ?? row.ID ?? row.product_id ?? Date.now() + index);
  const name = String(row.name ?? row.Name ?? "").trim();
  const brand = String(row.brand ?? row.Brand ?? "Unknown").trim();
  const price = Number(row.price ?? row.Price ?? 0);
  const compareAtRaw = row.compareAt ?? row.compare_at ?? row.CompareAt;
  const compareAt = compareAtRaw == null || compareAtRaw === "" ? null : Number(compareAtRaw);
  const category = inferCategory(row.category ?? row.Category ?? fallbackCategory);
  const desc = String(row.desc ?? row.description ?? row.Description ?? "").trim();
  const emoji = String(row.emoji ?? row.icon ?? "???").trim() || "???";
  const badgeRaw = String(row.badge ?? row.Badge ?? "").trim();
  const badge = badgeRaw || null;
  const image = String(row.image ?? row.imageUrl ?? row.image_url ?? "").trim() || null;
  const sizesRaw = String(row.sizes ?? row.size ?? row.Size ?? "One Size");
  const sizes = sizesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const bgA = String(row.bg1 ?? row.bg_start ?? "#eceff5");
  const bgB = String(row.bg2 ?? row.bg_end ?? "#d9dfea");

  if (!name) throw new Error(`Row ${index + 2}: name missing`);
  if (!Number.isFinite(price) || price < 0) throw new Error(`Row ${index + 2}: price invalid`);

  return {
    id: Number.isFinite(id) ? id : Date.now() + index,
    name,
    brand,
    price,
    compareAt: Number.isFinite(compareAt) ? compareAt : null,
    category,
    desc,
    emoji,
    badge,
    image,
    sizes: sizes.length ? sizes : ["One Size"],
    bg: [bgA, bgB],
    inStock: row.inStock == null ? true : Boolean(row.inStock),
  };
}

function Login({ email, password, setEmail, setPassword, onLogin, msg, busy }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.bg, padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 380, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
        <h2 style={{ color: C.text, marginBottom: 12 }}>Admin Login</h2>
        <input style={{ ...baseInput, marginBottom: 10 }} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={{ ...baseInput, marginBottom: 10 }} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {msg ? <p style={{ color: C.err, fontSize: 12, marginBottom: 10 }}>{msg}</p> : null}
        <button disabled={busy} onClick={onLogin} style={{ ...baseInput, cursor: "pointer", background: C.brand, color: "#061018", fontWeight: 700 }}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}

function ProductForm({ draft, setDraft, onSave, busy, onUploadImage, imageUploading }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
      <h3 style={{ color: C.text, marginBottom: 12 }}>Manual Product Add / Edit</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
        <input style={baseInput} placeholder="ID" value={draft.id} onChange={(e) => setDraft((p) => ({ ...p, id: e.target.value }))} />
        <input style={baseInput} placeholder="Name" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
        <input style={baseInput} placeholder="Brand" value={draft.brand} onChange={(e) => setDraft((p) => ({ ...p, brand: e.target.value }))} />
        <input style={baseInput} placeholder="Price" type="number" value={draft.price} onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))} />
        <select style={baseInput} value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}>
          {CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}
        </select>
        <input style={baseInput} placeholder="Badge" value={draft.badge} onChange={(e) => setDraft((p) => ({ ...p, badge: e.target.value }))} />
        <input style={baseInput} placeholder="Emoji" value={draft.emoji} onChange={(e) => setDraft((p) => ({ ...p, emoji: e.target.value }))} />
        <input style={baseInput} placeholder="Sizes (S,M,L)" value={draft.sizes} onChange={(e) => setDraft((p) => ({ ...p, sizes: e.target.value }))} />
      </div>
      <textarea style={{ ...baseInput, marginTop: 10, minHeight: 70 }} placeholder="Description" value={draft.desc} onChange={(e) => setDraft((p) => ({ ...p, desc: e.target.value }))} />
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <input style={{ ...baseInput, flex: 1, minWidth: 240 }} placeholder="Image URL" value={draft.image} onChange={(e) => setDraft((p) => ({ ...p, image: e.target.value }))} />
        <label style={{ ...baseInput, width: "auto", cursor: "pointer", background: C.panel2 }}>
          {imageUploading ? "Uploading..." : "Upload Image"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={onUploadImage} />
        </label>
      </div>
      <button onClick={onSave} disabled={busy} style={{ ...baseInput, marginTop: 12, cursor: "pointer", background: C.brand, color: "#061018", fontWeight: 700 }}>
        {busy ? "Saving..." : "Save Product"}
      </button>
    </div>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("all");
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [excelCategory, setExcelCategory] = useState("Accessories");
  const [imageUploading, setImageUploading] = useState(false);
  const [draft, setDraft] = useState({ id: "", name: "", brand: "", price: "", category: "Women", badge: "", emoji: "???", sizes: "S,M,L", desc: "", image: "" });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setAdmin(false);
        setReady(true);
        return;
      }
      try {
        const [userSnap, adminSnap] = await Promise.all([
          getDoc(doc(db, "users", u.uid)),
          getDoc(doc(db, "admins", u.uid)),
        ]);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const isAdmin =
          userData?.role === "admin" ||
          userData?.profile?.role === "admin" ||
          (adminSnap.exists() && adminSnap.data()?.active === true);
        setAdmin(Boolean(isAdmin));
      } catch {
        setAdmin(false);
      }
      setReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!admin) return undefined;
    const unsubs = [];
    unsubs.push(
      onSnapshot(doc(db, "catalog", "store"), (snap) => {
        const list = snap.data()?.products;
        setProducts(Array.isArray(list) ? list : []);
      }),
    );
    unsubs.push(
      onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
        setOrders(snap.docs.map((d) => ({ oid: d.id, ...d.data() })));
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [admin]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const textOk = !productSearch || [p.name, p.brand, p.category].join(" ").toLowerCase().includes(productSearch.toLowerCase());
      const catOk = productCategory === "all" || p.category === productCategory;
      return textOk && catOk;
    });
  }, [products, productSearch, productCategory]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!orderSearch) return true;
      const hay = [o.oid, o.customerName, o.customerEmail, o.status].join(" ").toLowerCase();
      return hay.includes(orderSearch.toLowerCase());
    });
  }, [orders, orderSearch]);

  const login = async () => {
    setBusy(true);
    setMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setMsg("Invalid email or password.");
    }
    setBusy(false);
  };

  const saveProducts = async (nextList, okMsg = "Products updated") => {
    setBusy(true);
    setMsg("");
    try {
      await setDoc(doc(db, "catalog", "store"), { products: nextList, updatedAt: serverTimestamp(), updatedBy: user?.email || user?.uid || null }, { merge: true });
      setMsg(okMsg);
    } catch (e) {
      setMsg(e?.message || "Save failed");
    }
    setBusy(false);
  };

  const saveProduct = async () => {
    const id = Number(draft.id || Date.now());
    const price = Number(draft.price);
    if (!draft.name.trim() || !Number.isFinite(price)) {
      setMsg("Product name and valid price required.");
      return;
    }
    const product = {
      id,
      name: draft.name.trim(),
      brand: draft.brand.trim() || "Unknown",
      price,
      category: inferCategory(draft.category),
      badge: draft.badge.trim() || null,
      emoji: draft.emoji.trim() || "???",
      sizes: draft.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      bg: ["#eceff5", "#d9dfea"],
      desc: draft.desc.trim() || "",
      image: draft.image.trim() || null,
      inStock: true,
    };
    const next = [...products];
    const index = next.findIndex((x) => Number(x.id) === id);
    if (index >= 0) next[index] = { ...next[index], ...product };
    else next.unshift(product);
    await saveProducts(next, "Product saved");
  };

  const editProduct = (p) => {
    setDraft({
      id: String(p.id ?? ""),
      name: p.name ?? "",
      brand: p.brand ?? "",
      price: String(p.price ?? ""),
      category: p.category ?? "Women",
      badge: p.badge ?? "",
      emoji: p.emoji ?? "???",
      sizes: Array.isArray(p.sizes) ? p.sizes.join(",") : "One Size",
      desc: p.desc ?? "",
      image: p.image ?? "",
    });
    setTab("products");
    setMsg("Editing product in form.");
  };

  const removeProduct = async (id) => {
    await saveProducts(products.filter((p) => Number(p.id) !== Number(id)), "Product deleted");
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const fileRef = ref(storage, `admin-products/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setDraft((prev) => ({ ...prev, image: url }));
      setMsg("Image uploaded.");
    } catch (e) {
      setMsg(e?.message || "Image upload failed");
    }
    setImageUploading(false);
    event.target.value = "";
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!rows.length) throw new Error("Excel file is empty");
      const parsed = rows.map((r, i) => parseRow(r, i, excelCategory));
      const mergedMap = new Map(products.map((p) => [Number(p.id), p]));
      for (const p of parsed) mergedMap.set(Number(p.id), p);
      await saveProducts(Array.from(mergedMap.values()), `Excel imported: ${parsed.length} products`);
    } catch (e) {
      setMsg(e?.message || "Excel import failed");
      setBusy(false);
    }
    event.target.value = "";
  };

  const updateOrderStatus = async (oid, status) => {
    setBusy(true);
    try {
      const selectedOrder = orders.find((o) => o.oid === oid);
      const changedBy = user?.email || user?.uid || "admin";
      await setDoc(
        doc(db, "orders", oid),
        { status, updatedAt: serverTimestamp(), updatedBy: changedBy },
        { merge: true },
      );
      await updateDoc(doc(db, "orders", oid), {
        statusHistory: arrayUnion({
          status,
          changedBy,
          changedAt: new Date().toISOString(),
        }),
      });

      if (selectedOrder?.customerUid) {
        const noteId = `${oid}-${Date.now()}`;
        await setDoc(doc(db, "users", selectedOrder.customerUid, "notifications", noteId), {
          type: "order_status",
          orderId: oid,
          status,
          title: "Order status updated",
          message: `Your order ${oid} is now ${status}.`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
      setMsg("Order status updated and notification sent");
    } catch (e) {
      setMsg(e?.message || "Order update failed");
    }
    setBusy(false);
  };

  const deleteOrder = async (oid) => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, "orders", oid));
      setMsg("Order deleted");
    } catch (e) {
      setMsg(e?.message || "Delete failed");
    }
    setBusy(false);
  };

  if (!ready) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.bg, color: C.text }}>Loading...</div>;
  }
  if (!user) {
    return <Login email={email} password={password} setEmail={setEmail} setPassword={setPassword} onLogin={login} msg={msg} busy={busy} />;
  }
  if (!admin) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center", padding: 20 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, color: C.text, maxWidth: 620 }}>
          <h3>Access denied</h3>
          <p style={{ marginTop: 8, color: C.muted }}>Need `users/{`{uid}`}` role=admin or `admins/{`{uid}`}` active=true.</p>
          <button onClick={() => signOut(auth)} style={{ ...baseInput, marginTop: 10, cursor: "pointer" }}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: 14 }}>
      <style>{`
        .grid-2{display:grid;grid-template-columns:260px 1fr;gap:12px}
        @media (max-width: 920px){.grid-2{grid-template-columns:1fr}}
        .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <h2 style={{ fontSize: 22 }}>Admin Dashboard</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ["dashboard", "Dashboard"],
            ["products", "Products CRUD"],
            ["orders", "Orders"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ ...baseInput, width: "auto", cursor: "pointer", background: tab === key ? C.brand : C.panel2, color: tab === key ? "#061018" : C.text }}>
              {label}
            </button>
          ))}
          <button onClick={() => signOut(auth)} style={{ ...baseInput, width: "auto", cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      {msg ? <p style={{ color: /fail|invalid|denied/i.test(msg) ? C.err : C.ok, marginBottom: 10 }}>{msg}</p> : null}

      {tab === "dashboard" && (
        <div className="stats">
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}><p style={{ color: C.muted }}>Products</p><h3>{products.length}</h3></div>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}><p style={{ color: C.muted }}>Orders</p><h3>{orders.length}</h3></div>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}><p style={{ color: C.muted }}>Admin</p><h3>{user.email}</h3></div>
        </div>
      )}

      {tab === "products" && (
        <div className="grid-2">
          <div>
            <ProductForm draft={draft} setDraft={setDraft} onSave={saveProduct} busy={busy} onUploadImage={uploadImage} imageUploading={imageUploading} />
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginTop: 12 }}>
              <h3 style={{ marginBottom: 10 }}>Excel Bulk Upload</h3>
              <p style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>Upload `.xlsx/.xls/.csv`. Column names can be: `id,name,brand,price,category,desc,sizes,image,badge,emoji`.</p>
              <a
                href="/product-upload-template.csv"
                download
                style={{ color: C.brand, fontSize: 12, textDecoration: "none", display: "inline-block", marginBottom: 10 }}
              >
                Download ready template CSV
              </a>
              <select style={{ ...baseInput, marginBottom: 10 }} value={excelCategory} onChange={(e) => setExcelCategory(e.target.value)}>
                {CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}
              </select>
              <label style={{ ...baseInput, cursor: "pointer", display: "block" }}>
                {busy ? "Processing..." : "Upload Excel File"}
                <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={importExcel} />
              </label>
            </div>
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <input style={{ ...baseInput, flex: 1, minWidth: 180 }} placeholder="Search name/brand/category" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
              <select style={{ ...baseInput, width: 150 }} value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}
              </select>
            </div>
            <div style={{ maxHeight: "70vh", overflow: "auto" }}>
              {filteredProducts.map((p) => (
                <div key={p.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>{p.name} <span style={{ color: C.muted, fontWeight: 400 }}>#{p.id}</span></p>
                    <p style={{ color: C.muted, fontSize: 12 }}>{p.brand} · {p.category} · ${p.price}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => editProduct(p)} style={{ ...baseInput, width: "auto", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => removeProduct(p.id)} style={{ ...baseInput, width: "auto", cursor: "pointer", borderColor: "#633", color: C.err }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input style={{ ...baseInput, maxWidth: 320 }} placeholder="Search order/customer/status" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
          </div>
          <div style={{ maxHeight: "74vh", overflow: "auto" }}>
            {filteredOrders.map((o) => (
              <div key={o.oid} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontWeight: 700 }}>Order {o.oid}</p>
                  <p style={{ color: C.muted, fontSize: 12 }}>{o.customerName || "Unknown"} · {o.customerEmail || "No email"}</p>
                  <p style={{ color: C.muted, fontSize: 12 }}>Total: ${o.total ?? 0} · Items: {Array.isArray(o.items) ? o.items.length : 0}</p>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <select style={{ ...baseInput, width: 150 }} value={o.status || "pending"} onChange={(e) => updateOrderStatus(o.oid, e.target.value)}>
                    <option value="pending">pending</option>
                    <option value="processing">processing</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                  <button onClick={() => deleteOrder(o.oid)} style={{ ...baseInput, width: "auto", color: C.err, borderColor: "#633" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

