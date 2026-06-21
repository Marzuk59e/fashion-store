import { useMemo, useState } from "react";
import { C, S, CATEGORIES, font } from "../../constants.js";
import MsgBanner from "../../components/MsgBanner.jsx";
import { getProductImage } from "../../../data/productImages.js";
import ProductForm from "./ProductForm.jsx";
import ExcelUploadPanel from "./ExcelUploadPanel.jsx";
import ScrollToTop from "../../components/ScrollToTop.jsx";

export default function ProductsPage({ products, onSave, onDelete, onToggleStock, busy, msg, setMsg }) {
  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("All");
  const [showForm,    setShowForm]    = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showExcel,   setShowExcel]   = useState(false);

  const filtered = useMemo(() => products.filter(p => {
    const q      = search.toLowerCase();
    const matchQ = !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    const matchC = catFilter === "All" || p.category === catFilter;
    return matchQ && matchC;
  }), [products, search, catFilter]);

  const handleEdit   = (p) => { setEditProduct(p); setShowForm(true); setShowExcel(false); };
  const handleAdd    = ()  => { setEditProduct(null); setShowForm(true); setShowExcel(false); };
  const handleExcel  = ()  => { setShowExcel(true); setShowForm(false); };
  const handleCancel = ()  => { setShowForm(false); setEditProduct(null); setShowExcel(false); };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: "0 0 4px" }}>Products</h2>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: 0 }}>{products.length} products in catalog</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={handleExcel}
            style={{ ...S.btnGhost, color: C.gold, borderColor: C.gold }}>📊 Excel Upload</button>
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
        <input style={{ ...S.input, flex: 1, minWidth: 200 }}
          placeholder="Search name, brand, category…"
          value={search} onChange={e => setSearch(e.target.value)}
          onFocus={e => e.target.style.borderColor = C.gold}
          onBlur={e => e.target.style.borderColor = C.border2} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ ...S.input, width: "auto", minWidth: 140, appearance: "none" }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 12, color: C.muted, fontFamily: font.mono, alignSelf: "center" }}>
          {filtered.length} results
        </span>
      </div>

      {/* Product table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "22%" }} /><col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} /><col style={{ width: "8%"  }} />
            <col style={{ width: "16%" }} /><col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} /><col style={{ width: "12%" }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Product", "Brand", "Category", "Price", "Sizes", "Badge", "Stock", "Actions"].map((h, idx) => (
                <th key={h} style={{
                  padding: "14px 14px", textAlign: idx === 0 ? "left" : "center",
                  color: C.muted, fontWeight: 700, fontSize: 11,
                  textTransform: "uppercase", letterSpacing: "0.09em",
                  fontFamily: font.mono, whiteSpace: "nowrap",
                  borderLeft: idx > 0 ? `1px solid ${C.border}` : "none",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: 14 }}>No products found</td></tr>
            )}
            {filtered.map((p, i) => (
              <tr key={p.id}
                style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "14px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={getProductImage(p)} alt=""
                      style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.border2}`, flexShrink: 0 }} />
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
                  {p.badge && (
                    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: C.goldBg, color: C.gold, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {p.badge}
                    </span>
                  )}
                </td>
                <td style={{ padding: "14px 14px", textAlign: "center", borderLeft: `1px solid ${C.border}` }}>
                  <button type="button" onClick={() => onToggleStock(p.id, p.inStock)} disabled={busy}
                    style={{
                      padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 20, border: "none",
                      cursor: busy ? "not-allowed" : "pointer",
                      background: p.inStock !== false ? C.successBg : C.errorBg,
                      color: p.inStock !== false ? "#6DBF8A" : "#CF8A8A",
                      letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.2s",
                    }}>
                    {p.inStock !== false ? "✓ In Stock" : "✕ Out"}
                  </button>
                </td>
                <td style={{ padding: "14px 14px", borderLeft: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button type="button" onClick={() => handleEdit(p)} style={{ ...S.btnGhost, padding: "5px 12px", fontSize: 11 }}>Edit</button>
                    <button type="button"
                      onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) onDelete(p.id); }}
                      style={{ ...S.btnDanger, padding: "5px 12px", fontSize: 11 }}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       <ScrollToTop />
    </div>
  );
}