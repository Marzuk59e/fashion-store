import { useRef, useState } from "react";
import { C, font, S, CATEGORIES } from "../../constants.js";
import FormField from "../../components/FormField.jsx";
import { getProductImage, normalizeProduct } from "../../data/productImages.js";
import { uploadImage } from "../../utils/imageUpload.js";

const EMPTY = {
  id: "", name: "", brand: "", price: "", category: "Women",
  badge: "", bg1: "#F5EEE6", bg2: "#EDE4D8", desc: "", image: "", sizes: "S,M,L",
};

export default function ProductForm({ initial, onSave, onCancel, busy }) {
  const [f, setF] = useState(() =>
    initial
      ? {
          ...EMPTY,
          id:       initial.id,
          name:     initial.name,
          brand:    initial.brand,
          price:    initial.price,
          category: initial.category,
          badge:    initial.badge || "",
          bg1:      initial.bg?.[0] || "#F5EEE6",
          bg2:      initial.bg?.[1] || "#EDE4D8",
          desc:     initial.desc,
          image:    getProductImage(initial),
          sizes:    Array.isArray(initial.sizes) ? initial.sizes.join(",") : initial.sizes,
        }
      : EMPTY
  );

  const [imgUploading, setImgUploading] = useState(false);
  const imgRef = useRef();
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleImgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      id:       Number(f.id) || Date.now(),
      name:     f.name.trim(),
      brand:    f.brand.trim(),
      price:    Number(f.price) || 0,
      category: f.category,
      badge:    f.badge.trim() || null,
      bg:       [f.bg1, f.bg2],
      desc:     f.desc.trim(),
      image:    f.image.trim(),
      sizes:    f.sizes.split(",").map(s => s.trim()).filter(Boolean),
    };
    if (!product.name)  return alert("Product name is required.");
    if (!product.image) return alert("Product photo is required. Upload an image or paste an image URL.");
    if (initial?.compareAt != null) product.compareAt = initial.compareAt;
    if (initial?.inStock  != null)  product.inStock   = initial.inStock;
    onSave(normalizeProduct(product));
  };

  const inp = { ...S.input };
  const focus = e => (e.target.style.borderColor = C.gold);
  const blur  = e => (e.target.style.borderColor = C.border2);

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 24, marginBottom: 24,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: C.text, fontFamily: font.serif }}>
          {initial ? "Edit Product" : "Add New Product"}
        </h3>
        <button type="button" onClick={onCancel}
          style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>×</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <FormField label="ID (number)">
          <input style={inp} placeholder="Auto if empty" value={f.id}
            onChange={e => set("id", e.target.value)} onFocus={focus} onBlur={blur} />
        </FormField>
        <FormField label="Category">
          <select value={f.category} onChange={e => set("category", e.target.value)}
            style={{ ...inp, appearance: "none" }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Product Name">
          <input style={inp} placeholder="Draped Silk Blouse" value={f.name}
            onChange={e => set("name", e.target.value)} onFocus={focus} onBlur={blur} />
        </FormField>
        <FormField label="Brand">
          <input style={inp} placeholder="Maison Élite" value={f.brand}
            onChange={e => set("brand", e.target.value)} onFocus={focus} onBlur={blur} />
        </FormField>
        <FormField label="Price (USD)">
          <input style={inp} type="number" placeholder="245" value={f.price}
            onChange={e => set("price", e.target.value)} onFocus={focus} onBlur={blur} />
        </FormField>
        <FormField label="Badge (optional)">
          <input style={inp} placeholder="New · Best Seller · Limited" value={f.badge}
            onChange={e => set("badge", e.target.value)} onFocus={focus} onBlur={blur} />
        </FormField>
        <FormField label="Sizes (comma-separated)">
          <input style={inp} placeholder="XS,S,M,L,XL" value={f.sizes}
            onChange={e => set("sizes", e.target.value)} onFocus={focus} onBlur={blur} />
        </FormField>
        <FormField label="BG Color 1">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="color" value={f.bg1} onChange={e => set("bg1", e.target.value)}
              style={{ width: 40, height: 38, border: `1px solid ${C.border2}`, borderRadius: 6, cursor: "pointer", background: "none", padding: 2 }} />
            <input style={{ ...inp, flex: 1 }} value={f.bg1}
              onChange={e => set("bg1", e.target.value)} onFocus={focus} onBlur={blur} />
          </div>
        </FormField>
        <FormField label="BG Color 2">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="color" value={f.bg2} onChange={e => set("bg2", e.target.value)}
              style={{ width: 40, height: 38, border: `1px solid ${C.border2}`, borderRadius: 6, cursor: "pointer", background: "none", padding: 2 }} />
            <input style={{ ...inp, flex: 1 }} value={f.bg2}
              onChange={e => set("bg2", e.target.value)} onFocus={focus} onBlur={blur} />
          </div>
        </FormField>
      </div>

      <FormField label="Description">
        <textarea style={{ ...inp, minHeight: 72, resize: "vertical" }}
          placeholder="Product description…" value={f.desc}
          onChange={e => set("desc", e.target.value)} onFocus={focus} onBlur={blur} />
      </FormField>

      <FormField label="Product Photo (required)">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input style={{ ...inp, flex: 1 }} placeholder="https://... or upload below"
            value={f.image} onChange={e => set("image", e.target.value)} onFocus={focus} onBlur={blur} />
          <input type="file" accept="image/*" ref={imgRef} style={{ display: "none" }} onChange={handleImgUpload} />
          <button type="button" onClick={() => imgRef.current?.click()}
            style={{ ...S.btnGhost, whiteSpace: "nowrap" }} disabled={imgUploading}>
            {imgUploading ? "Uploading…" : "Upload Image"}
          </button>
        </div>
        {f.image && (
          <img src={f.image} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 10, border: `1px solid ${C.border2}` }}
            onError={e => (e.target.style.display = "none")} />
        )}
      </FormField>

      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <button type="button" onClick={handleSave} disabled={busy}
          style={{ ...S.btnPrimary, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Saving…" : initial ? "Update Product" : "Add Product"}
        </button>
        <button type="button" onClick={onCancel} style={S.btnGhost}>Cancel</button>
      </div>
    </div>
  );
}
