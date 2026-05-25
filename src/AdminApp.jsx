// ─── Run once if Excel upload fails: npm install xlsx ────────
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, limit,
  onSnapshot, query, serverTimestamp,
  setDoc, updateDoc, orderBy,
} from "firebase/firestore";
import { adminAuth, adminDb, adminStorage } from "./firebase.js";
import { DEFAULT_PRODUCTS } from "./data/catalog.js";
import { getProductImage, normalizeProduct, normalizeProductList } from "./data/productImages.js";
import AdminLogin from "./AdminLogin.jsx";

/* ─── Design tokens ────────────────────────────────────────── */
const C = {
  cream: "#0C0B09",
  charcoal: "#F5F0E8",
  bg: "#0C0B09",
  surface: "#141310",
  surface2: "#1C1A16",
  border: "#252219",
  border2: "#302C22",
  gold: "#F0CC6A",
  goldBg: "rgba(226,188,92,0.10)",
  text: "#FFFFFF",
  warmGray: "#C4B9A8",
  muted: "#C4B9A8",
  success: "#4A7C59",
  successBg: "rgba(74,124,89,0.12)",
  error: "#8B3A3A",
  errorBg: "rgba(139,58,58,0.12)",
  warning: "#7A6020",
  warningBg: "rgba(226,188,92,0.12)",
};
const font = {
  serif: "'Cormorant Garamond', Georgia, serif",
  mono: "'Fira Code', 'Courier New', monospace",
  sans: "'DM Sans', system-ui, sans-serif",
};
const CATEGORIES = ["Women", "Men", "Kids", "Accessories"];
const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = {
  pending: { bg: "rgba(226,188,92,0.15)", color: "#E2BC5C" },
  processing: { bg: "rgba(90,125,138,0.2)", color: "#7AAEC0" },
  shipped: { bg: "rgba(74,124,89,0.2)", color: "#6DBF8A" },
  delivered: { bg: "rgba(74,124,89,0.3)", color: "#4CAF7C" },
  cancelled: { bg: "rgba(139,58,58,0.2)", color: "#CF8A8A" },
};

/* ─── Admin secret key ─────────────────────────────── */
// Change this to a strong secret before going live!
const ADMIN_SECRET_KEY = "sanjiiiii-admin-2025";


/* ─── Validation ────────────────────────────────────────────── */
function validateProductList(list) {
  if (!Array.isArray(list) || list.length === 0) return "Catalog must be a non-empty JSON array.";
  const seen = new Set();
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (!p || typeof p !== "object") return `Row ${i + 1}: invalid object.`;
    if (typeof p.id !== "number") return `Row ${i + 1}: "id" must be a number.`;
    if (seen.has(p.id)) return `Duplicate id: ${p.id}.`;
    seen.add(p.id);
    for (const k of ["name", "brand", "price", "category", "sizes", "bg", "desc", "image"]) {
      if (!(k in p)) return `Row ${i + 1}: missing "${k}".`;
    }
    if (typeof p.name !== "string" || !p.name.trim()) return `Row ${i + 1}: invalid name.`;
    if (typeof p.brand !== "string") return `Row ${i + 1}: invalid brand.`;
    if (typeof p.price !== "number" || p.price < 0) return `Row ${i + 1}: invalid price.`;
    if (typeof p.category !== "string") return `Row ${i + 1}: invalid category.`;
    if (typeof p.image !== "string" || !p.image.trim()) return `Row ${i + 1}: product photo (image URL) is required.`;
    if (!Array.isArray(p.sizes) || p.sizes.length === 0) return `Row ${i + 1}: sizes must be a non-empty array.`;
    if (!Array.isArray(p.bg) || p.bg.length < 2) return `Row ${i + 1}: bg must be [color, color].`;
    if (typeof p.desc !== "string") return `Row ${i + 1}: invalid desc.`;
  }
  return null;
}

/* ─── Excel parser ──────────────────────────────────────────── */
async function parseExcelFile(file) {
  let XLSX;
  try { XLSX = await import("xlsx"); }
  catch { throw new Error("xlsx package not found. Run: npm install xlsx"); }
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  if (!rows.length) throw new Error("Excel file is empty.");
  return rows.map((row, i) => {
    const bgRaw = String(row.bg || "#F5EEE6,#EDE4D8");
    const sizesRaw = String(row.sizes || "S,M,L");
    return {
      id: Number(row.id) || (Date.now() + i),
      name: String(row.name || "").trim(),
      brand: String(row.brand || "").trim(),
      price: Number(row.price) || 0,
      category: String(row.category || "Women").trim(),
      sizes: sizesRaw.split(",").map(s => s.trim()).filter(Boolean),
      badge: row.badge ? String(row.badge).trim() : null,
      bg: bgRaw.split(",").map(s => s.trim()).filter(Boolean),
      desc: String(row.desc || "").trim(),
      ...(String(row.image || "").trim() ? { image: String(row.image || "").trim() } : {}),
      ...(row.compareAt ? { compareAt: Number(row.compareAt) } : {}),
    };
  }).map(normalizeProduct).filter(p => p.name);
}

/* ─── Image upload helper ───────────────────────────────────── */
async function uploadImage(file) {
  if (!adminStorage) throw new Error("Firebase Storage not initialized. Export 'adminStorage' from firebase.js");
  const { ref: sRef, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const path = `admin-products/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const fileRef = sRef(adminStorage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

/* ─── Shared button/input styles ────────────────────────────── */
const S = {
  btnPrimary: {
    padding: "14px 24px", background: C.gold, border: "none", borderRadius: 4,
    color: "#FFFFFF", fontSize: 13, fontWeight: 700, fontFamily: font.sans,
    letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer",
  },
  btnGhost: {
    padding: "10px 18px", background: "transparent", border: `1px solid ${C.border2}`,
    borderRadius: 8, color: C.muted, fontSize: 12, fontWeight: 600,
    fontFamily: font.sans, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
  },
  btnDanger: {
    padding: "8px 14px", background: C.errorBg, border: `1px solid ${C.error}55`,
    borderRadius: 7, color: "#CF8A8A", fontSize: 12, fontWeight: 600,
    fontFamily: font.sans, cursor: "pointer",
  },
  input: {
    width: "100%", padding: "14px 16px", background: "#0C0B09", color: C.text,
    border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 16,
    fontFamily: font.sans, outline: "none", boxSizing: "border-box",
  },
  label: { fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5, display: "block" },
};

/* ─── Small reusable components ─────────────────────────────── */
function LoadingScreen({ text = "Loading…" }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 34, height: 34, border: `2px solid ${C.border2}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: C.muted, fontSize: 13, fontFamily: font.sans, margin: 0 }}>{text}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function MsgBanner({ msg, onClose }) {
  if (!msg) return null;
  const isErr = /fail|invalid|error|denied|could not|not found/i.test(msg);
  const isWarn = /warn|reset|default/i.test(msg);
  const bg = isErr ? C.errorBg : isWarn ? C.warningBg : C.successBg;
  const border = isErr ? C.error : isWarn ? C.warning : C.success;
  const color = isErr ? "#CF8A8A" : isWarn ? "#E2BC5C" : "#8BCF9A";
  const icon = isErr ? "⚠" : isWarn ? "◌" : "✓";
  return (
    <div style={{ padding: "11px 16px", borderRadius: 8, marginBottom: 16, background: bg, border: `1px solid ${border}44`, color, fontSize: 15, fontFamily: font.sans, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{icon} {msg}</span>
      {onClose && <button onClick={onClose} style={{ background: "none", border: "none", color, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>}
    </div>
  );
}

function NavBtn({ id, label, icon, active, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={() => onClick(id)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 18px",
        background: active ? C.goldBg : hov ? "rgba(255,255,255,0.025)" : "transparent",
        border: "none", borderLeft: `2px solid ${active ? C.gold : "transparent"}`,
        color: active ? C.gold : hov ? C.text : C.muted,
        fontSize: 15, fontFamily: font.sans, fontWeight: active ? 800 : 600,
        letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer", textAlign: "left", transition: "all 0.15s"
      }}>
      <span style={{ fontSize: 14 }}>{icon}</span>{label}
    </button>
  );
}

function StatCard({ label, value, sub, accent = C.gold }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `2px solid ${accent}`, borderRadius: 12, padding: "18px 22px", flex: 1, minWidth: 140 }}>
      <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: font.sans }}>{label}</p>
      <p style={{
        margin: 0,
        fontSize: 44,
        fontWeight: 700,
        color: C.text,
        fontFamily: "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        fontVariantNumeric: "tabular-nums lining-nums",
        letterSpacing: "0.01em",
        lineHeight: 1,
      }}>{value}</p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 500, color: C.muted }}>{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", background: s.bg, color: s.color, fontFamily: font.sans, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

function AccessDenied({ user, storefrontUrl, onLogout }) {
  const codeTagStyle = {
    color: "#E2BC5C",
    fontSize: 12,
    fontWeight: 700,
    background: "rgba(226,188,92,0.12)",
    padding: "2px 7px",
    borderRadius: 4,
    letterSpacing: "0.01em",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.sans, padding: 24 }}>
      <div style={{ maxWidth: 520, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "40px 36px" }}>
        <p style={{ margin: "0 0 16px", fontSize: 26 }}>⛔</p>
        <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 500, color: C.text }}>Access Denied</h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
          Your account (<span style={{ color: C.text }}>{user.email || user.uid}</span>) is not in the <code style={codeTagStyle}>admins</code> collection.
        </p>
        <div style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
          <ol style={{ margin: 0, paddingLeft: 20, color: C.text, fontSize: 13, lineHeight: 1.9 }}>
            <li>Open Firebase Console → Firestore.</li>
            <li>Create collection <strong style={{ color: C.gold }}>admins</strong> (if missing).</li>
            <li>Add document ID: <code style={codeTagStyle}>{user.uid}</code></li>
            <li>Set field <code style={codeTagStyle}>active</code> = <strong>true</strong>.</li>
            <li>Refresh this page.</li>
          </ol>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" onClick={onLogout} style={S.btnGhost}>Sign out</button>
          <a href={storefrontUrl} style={{ ...S.btnGhost, textDecoration: "none", display: "inline-block" }}>← Storefront</a>
        </div>
      </div>
    </div>
  );
}

/* ─── Product Form ──────────────────────────────────────────── */
function ProductForm({ initial, onSave, onCancel, busy }) {
  const empty = { id: "", name: "", brand: "", price: "", category: "Women", badge: "", bg1: "#F5EEE6", bg2: "#EDE4D8", desc: "", image: "", sizes: "S,M,L" };
  const [f, setF] = useState(() => initial ? {
    ...empty,
    id: initial.id,
    name: initial.name,
    brand: initial.brand,
    price: initial.price,
    category: initial.category,
    badge: initial.badge || "",
    bg1: (initial.bg?.[0] || "#F5EEE6"),
    bg2: (initial.bg?.[1] || "#EDE4D8"),
    desc: initial.desc,
    image: getProductImage(initial),
    sizes: Array.isArray(initial.sizes) ? initial.sizes.join(",") : initial.sizes,
  } : empty);
  const [imgFile, setImgFile] = useState(null);
  const [imgUploading, setImgUploading] = useState(false);
  const imgRef = useRef();

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleImgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgUploading(true);
    try {
      const url = await uploadImage(file);
      set("image", url);
    } catch (err) {
      set("image", URL.createObjectURL(file));
      alert("Storage upload failed. Using local preview only.\n" + err.message);
    } finally { setImgUploading(false); }
  };

  const handleSave = () => {
    const product = {
      id: Number(f.id) || Date.now(),
      name: f.name.trim(),
      brand: f.brand.trim(),
      price: Number(f.price) || 0,
      category: f.category,
      badge: f.badge.trim() || null,
      bg: [f.bg1, f.bg2],
      desc: f.desc.trim(),
      image: f.image.trim(),
      sizes: f.sizes.split(",").map(s => s.trim()).filter(Boolean),
    };
    if (!product.name) return alert("Product name is required.");
    if (!product.image) return alert("Product photo is required. Upload an image or paste an image URL.");
    if (initial?.compareAt != null) product.compareAt = initial.compareAt;
    if (initial?.inStock != null) product.inStock = initial.inStock;
    onSave(normalizeProduct(product));
  };

  const inputStyle = { ...S.input };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: C.text, fontFamily: font.serif }}>{initial ? "Edit Product" : "Add New Product"}</h3>
        <button type="button" onClick={onCancel} style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>×</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <FormField label="ID (number)">
          <input style={inputStyle} placeholder="Auto if empty" value={f.id} onChange={e => set("id", e.target.value)}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border2} />
        </FormField>
        <FormField label="Category">
          <select value={f.category} onChange={e => set("category", e.target.value)}
            style={{ ...inputStyle, appearance: "none" }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Product Name">
          <input style={inputStyle} placeholder="Draped Silk Blouse" value={f.name} onChange={e => set("name", e.target.value)}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border2} />
        </FormField>
        <FormField label="Brand">
          <input style={inputStyle} placeholder="Maison Élite" value={f.brand} onChange={e => set("brand", e.target.value)}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border2} />
        </FormField>
        <FormField label="Price (USD)">
          <input style={inputStyle} type="number" placeholder="245" value={f.price} onChange={e => set("price", e.target.value)}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border2} />
        </FormField>
        <FormField label="Badge (optional)">
          <input style={inputStyle} placeholder="New · Best Seller · Limited" value={f.badge} onChange={e => set("badge", e.target.value)}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border2} />
        </FormField>
        <FormField label="Sizes (comma-separated)">
          <input style={inputStyle} placeholder="XS,S,M,L,XL" value={f.sizes} onChange={e => set("sizes", e.target.value)}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border2} />
        </FormField>
        <FormField label="BG Color 1">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="color" value={f.bg1} onChange={e => set("bg1", e.target.value)}
              style={{ width: 40, height: 38, border: `1px solid ${C.border2}`, borderRadius: 6, cursor: "pointer", background: "none", padding: 2 }} />
            <input style={{ ...inputStyle, flex: 1 }} value={f.bg1} onChange={e => set("bg1", e.target.value)}
              onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border2} />
          </div>
        </FormField>
        <FormField label="BG Color 2">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="color" value={f.bg2} onChange={e => set("bg2", e.target.value)}
              style={{ width: 40, height: 38, border: `1px solid ${C.border2}`, borderRadius: 6, cursor: "pointer", background: "none", padding: 2 }} />
            <input style={{ ...inputStyle, flex: 1 }} value={f.bg2} onChange={e => set("bg2", e.target.value)}
              onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border2} />
          </div>
        </FormField>
      </div>
      <FormField label="Description">
        <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} placeholder="Product description…" value={f.desc}
          onChange={e => set("desc", e.target.value)}
          onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border2} />
      </FormField>
      <FormField label="Product Photo (required)">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="https://... or upload below" value={f.image}
            onChange={e => set("image", e.target.value)}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border2} />
          <input type="file" accept="image/*" ref={imgRef} style={{ display: "none" }} onChange={handleImgUpload} />
          <button type="button" onClick={() => imgRef.current?.click()}
            style={{ ...S.btnGhost, whiteSpace: "nowrap" }} disabled={imgUploading}>
            {imgUploading ? "Uploading…" : "Upload Image"}
          </button>
        </div>
        {f.image && (
          <img src={f.image} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 10, border: `1px solid ${C.border2}` }} onError={e => e.target.style.display = "none"} />
        )}
      </FormField>
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <button type="button" onClick={handleSave} disabled={busy} style={{ ...S.btnPrimary, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Saving…" : initial ? "Update Product" : "Add Product"}
        </button>
        <button type="button" onClick={onCancel} style={S.btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

/* ─── Excel Upload Panel ─────────────────────────────────────── */
function ExcelUploadPanel({ existingProducts, onUpload, onClose, busy }) {
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState("");
  const [mode, setMode] = useState("replace"); // "replace" | "merge"
  const dropRef = useRef();

  const handleFile = async (file) => {
    setErr("");
    setPreview(null);
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) { setErr("Only .xlsx, .xls, or .csv files accepted."); return; }
    try {
      const products = await parseExcelFile(file);
      if (!products.length) { setErr("No valid products found in file."); return; }
      setPreview(products);
    } catch (e) { setErr(e.message); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleConfirm = () => {
    if (!preview) return;
    let final;
    if (mode === "replace") {
      final = preview;
    } else {
      const map = new Map(existingProducts.map(p => [p.id, p]));
      preview.forEach(p => map.set(p.id, p));
      final = [...map.values()];
    }
    onUpload(final);
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: C.text, fontFamily: font.serif }}>Bulk Upload via Excel</h3>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>×</button>
      </div>

      {/* Format guide */}
      <div style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Required columns</p>
        <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: font.mono, lineHeight: 1.8 }}>
          id · name · brand · price · category · sizes (comma-sep) · badge · bg (2 hex, comma-sep) · desc · image (url, required)
        </p>
      </div>

      {/* Drop zone */}
      {!preview && (
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.gold; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = C.border2; }}
          style={{ border: `2px dashed ${C.border2}`, borderRadius: 10, padding: "32px 20px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
          onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".xlsx,.xls,.csv"; inp.onchange = e => handleFile(e.target.files?.[0]); inp.click(); }}
        >
          <p style={{ margin: "0 0 6px", fontSize: 22, opacity: 0.5 }}>📊</p>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 500, color: C.text }}>Drop your Excel file here</p>
          <p style={{ margin: 0, fontSize: 12, color: C.muted }}>or click to browse · .xlsx .xls .csv</p>
        </div>
      )}

      {err && <MsgBanner msg={err} onClose={() => setErr("")} />}

      {/* Preview table */}
      {preview && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{preview.length} products found</p>
            <button type="button" onClick={() => setPreview(null)} style={S.btnGhost}>Clear</button>
          </div>

          {/* Merge mode */}
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            {[["replace", "Replace all existing products"], ["merge", "Merge (keep existing, add/update from file)"]].map(([val, lbl]) => (
              <label key={val} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: mode === val ? C.gold : C.muted, fontFamily: font.sans }}>
                <input type="radio" value={val} checked={mode === val} onChange={() => setMode(val)} style={{ accentColor: C.gold }} /> {lbl}
              </label>
            ))}
          </div>

          <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 10, maxHeight: 220, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0 }}>
                <tr style={{ background: C.surface2 }}>
                  {["ID", "Name", "Brand", "Price", "Category", "Sizes", "Badge"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.muted, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "8px 12px", color: C.muted, fontFamily: font.mono }}>{p.id}</td>
                    <td style={{ padding: "8px 12px", color: C.text, fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: "8px 12px", color: C.muted }}>{p.brand}</td>
                    <td style={{ padding: "8px 12px", color: C.gold, fontFamily: font.mono }}>${p.price}</td>
                    <td style={{ padding: "8px 12px", color: C.muted }}>{p.category}</td>
                    <td style={{ padding: "8px 12px", color: C.muted }}>{p.sizes?.join(", ")}</td>
                    <td style={{ padding: "8px 12px", color: C.muted }}>{p.badge || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <button type="button" onClick={handleConfirm} disabled={busy} style={{ ...S.btnPrimary, opacity: busy ? 0.6 : 1 }}>
              {busy ? "Uploading…" : `Upload ${preview.length} Products`}
            </button>
            <button type="button" onClick={onClose} style={S.btnGhost}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Dashboard Page ─────────────────────────────────────────── */
function DashboardPage({ products, customers, customersLoaded, orders }) {
  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  return (
    <div>
      <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: "0 0 5px" }}>Overview</h2>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: "0 0 26px" }}>
        Live from Firestore · <span style={{ color: C.gold }}>catalog/store</span>
      </p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Products Live" value={products.length} />
        <StatCard label="Customers" value={customersLoaded ? customers.length : "—"} accent="#5A7D8A" />
        <StatCard label="Total Orders" value={orders.length} accent="#7A6090" />
        <StatCard label="Pending Orders" value={pendingOrders} accent="#8B6E2A" sub={pendingOrders > 0 ? "Need action" : "All clear"} />
        <StatCard label="Revenue (Delivered)" value={`$${totalRevenue.toLocaleString()}`} accent="#4A7C59" />
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 26px", maxWidth: 600 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: font.mono, margin: "0 0 20px" }}>Quick guide</p>
        {[
          { n: "01", t: "Edit products", d: "Go to Products tab to add, edit, or delete products. Use Excel upload for bulk." },
          { n: "02", t: "Manage orders", d: "View and update order statuses in the Orders tab. Change from pending → shipped etc." },
          { n: "03", t: "View customers", d: "Load up to 200 Firebase sign-in users from the Customers tab." },
          { n: "04", t: "Grant admin access", d: "Create admins/<Firebase UID> in Firestore with active: true." },
        ].map(({ n, t, d }) => (
          <div key={n} style={{ display: "flex", gap: 14, marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: font.mono, minWidth: 18, paddingTop: 3 }}>{n}</span>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 5px" }}>{t}</p>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: 0 }}>{d}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4CAF7C", display: "inline-block" }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: C.muted }}>Store is live · Connected to Firebase</span>
      </div>
    </div>
  );
}

/* ─── Products Page ──────────────────────────────────────────── */
function ProductsPage({ products, onSave, onDelete, busy, msg, setMsg }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showExcel, setShowExcel] = useState(false);

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    const matchC = catFilter === "All" || p.category === catFilter;
    return matchQ && matchC;
  }), [products, search, catFilter]);

  const handleEdit = (p) => { setEditProduct(p); setShowForm(true); setShowExcel(false); };
  const handleAdd = () => { setEditProduct(null); setShowForm(true); setShowExcel(false); };
  const handleExcel = () => { setShowExcel(true); setShowForm(false); };
  const handleCancel = () => { setShowForm(false); setEditProduct(null); setShowExcel(false); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: "0 0 4px" }}>Products</h2>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: 0 }}>{products.length} products in catalog</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={handleExcel} style={{ ...S.btnGhost, color: C.gold, borderColor: C.gold }}>📊 Excel Upload</button>
          <button type="button" onClick={handleAdd} style={S.btnPrimary}>+ Add Product</button>
        </div>
      </div>

      <MsgBanner msg={msg} onClose={() => setMsg("")} />

      {showExcel && (
        <ExcelUploadPanel
          existingProducts={products}
          onUpload={async (list) => { await onSave(list, "bulk"); handleCancel(); }}
          onClose={handleCancel}
          busy={busy}
        />
      )}

      {showForm && (
        <ProductForm
          initial={editProduct}
          onSave={async (p) => { await onSave(p, editProduct ? "edit" : "add"); handleCancel(); }}
          onCancel={handleCancel}
          busy={busy}
        />
      )}

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          style={{ ...S.input, flex: 1, minWidth: 200 }}
          placeholder="Search name, brand, category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => e.target.style.borderColor = C.gold}
          onBlur={e => e.target.style.borderColor = C.border2}
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{ ...S.input, width: "auto", minWidth: 140, appearance: "none" }}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 12, color: C.muted, fontFamily: font.mono, alignSelf: "center" }}>{filtered.length} results</span>
      </div>

      {/* Product table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "24%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "19%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Product", "Brand", "Category", "Price", "Sizes", "Badge", "Actions"].map((h, idx) => (
                <th
                  key={h}
                  style={{
                    padding: "14px 14px",
                    textAlign: idx === 0 ? "left" : "center",
                    color: C.muted,
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                    fontFamily: font.mono,
                    whiteSpace: "nowrap",
                    borderLeft: idx > 0 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: 14 }}>No products found</td></tr>
            )}
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "14px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={getProductImage(p)} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.border2}`, flexShrink: 0 }} />
                    <span style={{ color: C.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 14px", color: C.muted, textAlign: "center", borderLeft: `1px solid ${C.border}` }}>{p.brand}</td>
                <td style={{ padding: "14px 14px", color: C.muted, textAlign: "center", borderLeft: `1px solid ${C.border}` }}>{p.category}</td>
                <td style={{ padding: "14px 14px", color: C.gold, fontFamily: font.mono, fontWeight: 600, textAlign: "center", borderLeft: `1px solid ${C.border}` }}>${p.price}</td>
                <td style={{ padding: "14px 14px", color: C.muted, fontSize: 11, textAlign: "center", borderLeft: `1px solid ${C.border}` }}>
                  <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {Array.isArray(p.sizes) ? p.sizes.join(", ") : p.sizes}
                  </span>
                </td>
                <td style={{ padding: "14px 14px", textAlign: "center", borderLeft: `1px solid ${C.border}` }}>
                  {p.badge && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: C.goldBg, color: C.gold, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.badge}</span>}
                </td>
                <td style={{ padding: "14px 14px", borderLeft: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button type="button" onClick={() => handleEdit(p)} style={{ ...S.btnGhost, padding: "5px 12px", fontSize: 11 }}>Edit</button>
                    <button type="button" onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) onDelete(p.id); }} style={{ ...S.btnDanger, padding: "5px 12px", fontSize: 11 }}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Orders Page ────────────────────────────────────────────── */
function OrdersPage({ orders, onStatusChange, busy }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    const matchQ = !q || o.customerEmail?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || o.status === statusFilter;
    return matchQ && matchS;
  }), [orders, search, statusFilter]);

  if (orders.length === 0) return (
    <div>
      <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: "0 0 5px" }}>Orders</h2>
      <p style={{ fontSize: 14, color: C.muted, margin: "0 0 32px" }}>Manage customer orders</p>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: C.muted }}>
        <span style={{ fontSize: 32, opacity: 0.3 }}>📦</span>
        <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No orders yet</p>
        <p style={{ fontSize: 13, margin: 0 }}>Orders will appear here once customers start purchasing.</p>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: "0 0 5px" }}>Orders</h2>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: "0 0 22px" }}>{orders.length} total orders</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          style={{ ...S.input, flex: 1, minWidth: 200 }}
          placeholder="Search by customer, email, order ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => e.target.style.borderColor = C.gold}
          onBlur={e => e.target.style.borderColor = C.border2}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ ...S.input, width: "auto", minWidth: 150, appearance: "none" }}>
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Order ID", "Customer", "Date", "Items", "Total", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: C.muted, fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: font.mono, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => {
              const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—";
              return (
                <tr key={o.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 14px", color: C.muted, fontFamily: font.mono, fontSize: 11 }}>{o.id?.slice(0, 8)}…</td>
                  <td style={{ padding: "13px 14px" }}>
                    <p style={{ margin: "0 0 2px", color: C.text, fontWeight: 500 }}>{o.customerName || "—"}</p>
                    <p style={{ margin: 0, color: C.muted, fontSize: 11 }}>{o.customerEmail || ""}</p>
                  </td>
                  <td style={{ padding: "13px 14px", color: C.muted, fontSize: 12 }}>{date}</td>
                  <td style={{ padding: "13px 14px", color: C.text, fontFamily: font.mono }}>{Array.isArray(o.items) ? o.items.length : "—"}</td>
                  <td style={{ padding: "13px 14px", color: C.gold, fontFamily: font.mono, fontWeight: 600 }}>${(o.total || 0).toFixed(2)}</td>
                  <td style={{ padding: "13px 14px" }}><StatusBadge status={o.status || "pending"} /></td>
                  <td style={{ padding: "13px 14px" }}>
                    <select
                      value={o.status || "pending"}
                      onChange={e => onStatusChange(o.id, e.target.value)}
                      disabled={busy}
                      style={{ ...S.input, width: 130, padding: "6px 10px", fontSize: 12, appearance: "none" }}
                    >
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
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

/* ─── Customers Page ─────────────────────────────────────────── */
function CustomersPage({ customers, customersLoaded, onLoad, busy, msg, setMsg }) {
  return (
    <div>
      <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: "0 0 5px" }}>Customers</h2>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: "0 0 26px" }}>Up to 200 Firebase sign-in users. Local-only accounts are not listed.</p>
      <MsgBanner msg={msg} onClose={() => setMsg("")} />
      <button type="button" disabled={busy} onClick={onLoad}
        style={{ ...S.btnGhost, marginBottom: 20, color: customersLoaded ? C.muted : C.gold, borderColor: customersLoaded ? C.border2 : C.gold }}>
        {busy ? "Loading…" : customersLoaded ? "Reload list" : "Load customers"}
      </button>
      {!customersLoaded && !busy && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: C.muted }}>
          <span style={{ fontSize: 30, opacity: 0.35 }}>◉</span>
          <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Customer data not loaded yet</p>
        </div>
      )}
      {customersLoaded && (
        <>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.muted, fontFamily: font.mono, margin: "0 0 14px" }}>{customers.length} customers loaded</p>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Name", "Email", "Orders", "UID"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: C.muted, fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: font.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < customers.length - 1 ? `1px solid ${C.border}` : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "13px 14px", color: C.text, fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.goldBg, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.gold, fontWeight: 700, flexShrink: 0 }}>
                          {(c.name !== "—" ? c.name : c.email)?.[0]?.toUpperCase() || "?"}
                        </div>
                        {c.name}
                      </div>
                    </td>
                    <td style={{ padding: "13px 14px", color: C.muted, fontSize: 12 }}>{c.email}</td>
                    <td style={{ padding: "13px 14px", color: C.text, fontFamily: font.mono, fontWeight: 600 }}>{c.orders}</td>
                    <td style={{ padding: "13px 14px", color: C.muted, fontFamily: font.mono, fontSize: 10 }}>{c.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main AdminApp ──────────────────────────────────────────── */
export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [adminOk, setAdminOk] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [products, setProducts] = useState(() => normalizeProductList(DEFAULT_PRODUCTS));
  const [customers, setCustomers] = useState([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [orders, setOrders] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const storefrontUrl = useMemo(() => {
    const u = new URL(window.location.href);
    u.pathname = u.pathname.replace(/\/admin\.html$/i, "/");
    u.hash = "";
    return u.origin + "/";
  }, []);

  useEffect(() => { document.title = "Admin · sanjiiiii"; }, []);

  useEffect(() => {
    if (document.getElementById("adm-fonts")) return;
    const l = document.createElement("link"); l.id = "adm-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500;600;800&family=Fira+Code:wght@400&display=swap";
    document.head.appendChild(l);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(adminAuth, u => { setUser(u); setAuthReady(true); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) { setAdminOk(false); setAdminCheckDone(true); return; }
    setAdminCheckDone(false);
    let cancelled = false;
    (async () => {
      try {
        const adminSnap = await getDoc(doc(adminDb, "admins", user.uid));
        let ok = adminSnap.exists() && adminSnap.data()?.active === true;
        if (!ok) {
          const userSnap = await getDoc(doc(adminDb, "users", user.uid));
          ok = userSnap.exists() && (userSnap.data()?.role === "admin" || userSnap.data()?.profile?.role === "admin");
        }
        if (!cancelled) { setAdminOk(ok); setAdminCheckDone(true); }
      } catch { if (!cancelled) { setAdminOk(false); setAdminCheckDone(true); } }
    })();
    return () => { cancelled = true; };
  }, [user]);

  /* Live products */
  useEffect(() => {
    if (!adminOk) return;
    const unsub = onSnapshot(doc(adminDb, "catalog", "store"), snap => {
      const list = snap.exists() ? snap.data()?.products : null;
      const raw = Array.isArray(list) && list.length ? list : DEFAULT_PRODUCTS;
      setProducts(normalizeProductList(raw));
    });
    return () => unsub();
  }, [adminOk]);

  /* Live orders */
  useEffect(() => {
    if (!adminOk) return;
    try {
      const q = query(collection(adminDb, "orders"), orderBy("createdAt", "desc"), limit(200));
      const unsub = onSnapshot(q, snap => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    } catch { return undefined; }
  }, [adminOk]);

  const createAdminAccount = async ({ name, email: em, password: pw, secretKey }) => {
    if (secretKey !== ADMIN_SECRET_KEY) {
      throw new Error("Invalid admin secret key. Contact the site owner.");
    }
    setBusy(true); setMsg("");
    try {
      const cred = await createUserWithEmailAndPassword(adminAuth, em, pw);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(adminDb, "admins", cred.user.uid), {
        active: true,
        email: em,
        name: name,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      setBusy(false);
      const errMap = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-email": "Invalid email address.",
      };
      throw new Error(errMap[e.code] || e.message || "Account creation failed.");
    } finally {
      setBusy(false);
    }
  };

  const loginEmail = async () => {
    setBusy(true); setMsg("");
    try { await signInWithEmailAndPassword(adminAuth, email, password); }
    catch { setMsg("Invalid email or password."); }
    finally { setBusy(false); }
  };

  const logout = async () => {
    try { await signOut(adminAuth); } catch { void 0; }
    setCustomers([]); setCustomersLoaded(false); setOrders([]);
  };

  const loadCustomers = useCallback(async () => {
    if (!adminOk) return;
    setBusy(true); setMsg("");
    try {
      const snap = await getDocs(query(collection(adminDb, "users"), limit(200)));
      const rows = snap.docs.map(d => {
        const x = d.data() || {};
        const isAdmin = x.role === "admin" || x.profile?.role === "admin";
        return { id: d.id, email: x.email || "—", name: x.name || "—", orders: Array.isArray(x.orders) ? x.orders.length : 0, isAdmin };
      }).filter((r) => !r.isAdmin).sort((a, b) => b.orders - a.orders);
      setCustomers(rows); setCustomersLoaded(true);
    } catch (e) { setMsg(e?.message || "Could not load customers."); }
    finally { setBusy(false); }
  }, [adminOk]);

  /* Save catalog to Firestore */
  const saveProducts = useCallback(async (updatedProducts, operation) => {
    setMsg("");
    const err = validateProductList(updatedProducts);
    if (err) { setMsg(err); return; }
    setBusy(true);
    try {
      const clean = JSON.parse(JSON.stringify(normalizeProductList(updatedProducts)));
      await setDoc(doc(adminDb, "catalog", "store"),
        { products: clean, updatedAt: serverTimestamp(), updatedBy: user?.email || user?.uid || null },
        { merge: true });
      const opMap = { add: "Product added", edit: "Product updated", bulk: "Bulk upload complete", delete: "Product deleted" };
      setMsg(opMap[operation] || "Catalog saved. Storefront updates automatically.");
    } catch (e) { setMsg(e?.message || "Save failed. Check Firestore rules."); }
    finally { setBusy(false); }
  }, [user]);

  const handleProductSave = useCallback(async (product, operation) => {
    let updated;
    if (operation === "bulk") {
      updated = product; // already an array
    } else if (operation === "add") {
      if (products.some(p => p.id === product.id)) {
        product.id = Date.now();
      }
      updated = [...products, product];
    } else if (operation === "edit") {
      updated = products.map(p => p.id === product.id ? product : p);
    }
    await saveProducts(updated, operation);
  }, [products, saveProducts]);

  const handleProductDelete = useCallback(async (id) => {
    const updated = products.filter(p => p.id !== id);
    await saveProducts(updated, "delete");
  }, [products, saveProducts]);

  const handleOrderStatusChange = useCallback(async (orderId, newStatus) => {
    setBusy(true);
    try {
      await updateDoc(doc(adminDb, "orders", orderId), { status: newStatus, updatedAt: serverTimestamp() });
    } catch (e) { setMsg(e?.message || "Could not update order status."); }
    finally { setBusy(false); }
  }, []);

  /* Guards */
  if (!authReady) return <LoadingScreen text="Loading…" />;
  if (!adminCheckDone) return <LoadingScreen text="Checking admin access…" />;
  if (!user) return <AdminLogin storefrontUrl={storefrontUrl} busy={busy} msg={msg} setMsg={setMsg} email={email} password={password} setEmail={setEmail} setPassword={setPassword} onLogin={loginEmail} onCreateAccount={createAdminAccount} />;
  if (!adminOk) return <AccessDenied user={user} storefrontUrl={storefrontUrl} onLogout={logout} />;

  const navItems = [
    { id: "dashboard", label: "Overview", icon: "◈" },
    { id: "products", label: "Products", icon: "⟨⟩" },
    { id: "orders", label: "Orders", icon: "◻" },
    { id: "customers", label: "Customers", icon: "◉" },
  ];

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
          <span style={{ fontSize: 18, fontWeight: 400, fontFamily: font.serif, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gold }}>Sanj<span style={{ color: C.gold }}>iiiii</span></span>
          <span style={{ color: C.border2, margin: "0 4px" }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 12, color: C.muted, display: "none" }} className="user-email-header">{user.email}</span>
          <a href={storefrontUrl} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 700, color: C.gold, textDecoration: "none" }}>View store ↗</a>
          <button type="button" onClick={logout} style={{ ...S.btnGhost, padding: "6px 14px", fontSize: 11 }}>Sign out</button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <aside className="adm-sidebar" style={{ width: 250, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <nav style={{ padding: "20px 0", flex: 1 }}>
            {navItems.map(n => <NavBtn key={n.id} {...n} active={tab === n.id} onClick={id => { setTab(id); setMsg(""); }} />)}
          </nav>
          <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.goldBg, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.gold, fontWeight: 700, flexShrink: 0 }}>
              {(user.email?.[0] || "A").toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 2 }}>Admin</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="adm-main-pad" style={{ flex: 1, overflowY: "auto", padding: "44px 56px" }}>
          {tab === "dashboard" && <DashboardPage products={products} customers={customers} customersLoaded={customersLoaded} orders={orders} />}
          {tab === "products" && <ProductsPage products={products} onSave={handleProductSave} onDelete={handleProductDelete} busy={busy} msg={msg} setMsg={setMsg} />}
          {tab === "orders" && <OrdersPage orders={orders} onStatusChange={handleOrderStatusChange} busy={busy} />}
          {tab === "customers" && <CustomersPage customers={customers} customersLoaded={customersLoaded} onLoad={loadCustomers} busy={busy} msg={msg} setMsg={setMsg} />}
        </main>
      </div>

      <nav className="adm-mobile-nav" aria-label="Admin sections">
        {navItems.map(n => (
          <button key={n.id} type="button" className={tab === n.id ? "active" : ""} onClick={() => { setTab(n.id); setMsg(""); }}>
            <span aria-hidden>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
