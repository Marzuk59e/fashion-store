import { useRef, useState } from "react";
import { C, font, S, CATEGORIES } from "../constants.js";
import FormField from "../components/FormField.jsx";
import { getProductImage, getProductImages, normalizeProduct } from "../../data/productImages.js";
import { uploadImage } from "../utils/imageUpload.js";

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
  const [images, setImages] = useState(() => (initial ? getProductImages(initial) : []));
  const [urlInput, setUrlInput] = useState("");
  const imgRef = useRef();
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleImgUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImgUploading(true);
    for (const file of files) {
      try {
        const url = await uploadImage(file);
        setImages(prev => [...prev, url]);
      } catch (err) {
        setImages(prev => [...prev, URL.createObjectURL(file)]);
        alert(`"${file.name}" upload failed. Using local preview only.\n` + err.message);
      }
    }
    setImgUploading(false);
    e.target.value = ""; // same file abar select korte parbe
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    setImages(prev => [...prev, url]);
    setUrlInput("");
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const moveImage = (idx, dir) => {
    setImages(prev => {
      const arr = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return arr;
    });
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
      image:    images[0] || "",
      images:   images,
      sizes:    f.sizes.split(",").map(s => s.trim()).filter(Boolean),
    };
    if (!product.name)      return alert("Product name is required.");
    if (images.length === 0) return alert("At least one product photo is required. Upload an image or paste an image URL.");
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

      <FormField label="Product Photos (min 1 required, first = cover photo)">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input style={{ ...inp, flex: 1 }} placeholder="Paste image URL, then click Add URL"
            value={urlInput} onChange={e => setUrlInput(e.target.value)} onFocus={focus} onBlur={blur} />
          <button type="button" onClick={handleAddUrl} style={{ ...S.btnGhost, whiteSpace: "nowrap" }}>Add URL</button>
          <input type="file" accept="image/*" multiple ref={imgRef} style={{ display: "none" }} onChange={handleImgUpload} />
          <button type="button" onClick={() => imgRef.current?.click()}
            style={{ ...S.btnGhost, whiteSpace: "nowrap" }} disabled={imgUploading}>
            {imgUploading ? "Uploading…" : "Upload Images"}
          </button>
        </div>

        {images.length > 0 && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
            {images.map((url, i) => (
              <div key={url + i} style={{ position: "relative" }}>
                <img src={url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border2}` }}
                  onError={e => (e.target.style.opacity = 0.25)} />
                <button type="button" onClick={() => removeImage(i)} aria-label="Remove photo"
                  style={{
                    position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                    background: C.errorBg, color: "#CF8A8A", border: "none", cursor: "pointer",
                    fontSize: 12, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>×</button>
                {images.length > 1 && (
                  <div style={{ display: "flex", gap: 2, marginTop: 4, justifyContent: "center" }}>
                    <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0}
                      style={{ ...S.btnGhost, padding: "1px 6px", fontSize: 10, opacity: i === 0 ? 0.3 : 1 }}>◀</button>
                    <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1}
                      style={{ ...S.btnGhost, padding: "1px 6px", fontSize: 10, opacity: i === images.length - 1 ? 0.3 : 1 }}>▶</button>
                  </div>
                )}
                {i === 0 && (
                  <span style={{
                    position: "absolute", bottom: images.length > 1 ? 22 : -8, left: 4, fontSize: 9, fontWeight: 700,
                    background: C.gold, color: "#fff", padding: "1px 6px", borderRadius: 20, textTransform: "uppercase",
                  }}>Cover</span>
                )}
              </div>
            ))}
          </div>
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
