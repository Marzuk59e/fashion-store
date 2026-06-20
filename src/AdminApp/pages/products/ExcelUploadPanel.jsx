import { useRef, useState } from "react";
import { C, font, S } from "../../constants.js";
import MsgBanner from "../../components/MsgBanner.jsx";
import { parseExcelFile } from "../../utils/excelParser.js";

export default function ExcelUploadPanel({ existingProducts, onUpload, onClose, busy }) {
  const [preview, setPreview] = useState(null);
  const [err, setErr]         = useState("");
  const [mode, setMode]       = useState("replace"); // "replace" | "merge"
  const dropRef = useRef();

  const handleFile = async (file) => {
    setErr(""); setPreview(null);
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setErr("Only .xlsx, .xls, or .csv files accepted."); return;
    }
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
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 24, marginBottom: 24,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: C.text, fontFamily: font.serif }}>
          Bulk Upload via Excel
        </h3>
        <button type="button" onClick={onClose}
          style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>×</button>
      </div>

      {/* Format guide */}
      <div style={{
        background: C.bg, border: `1px solid ${C.border2}`,
        borderRadius: 8, padding: "12px 16px", marginBottom: 16,
      }}>
        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Required columns
        </p>
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
          style={{
            border: `2px dashed ${C.border2}`, borderRadius: 10,
            padding: "32px 20px", textAlign: "center",
            cursor: "pointer", transition: "border-color 0.2s",
          }}
          onClick={() => {
            const inp = document.createElement("input");
            inp.type = "file"; inp.accept = ".xlsx,.xls,.csv";
            inp.onchange = e => handleFile(e.target.files?.[0]);
            inp.click();
          }}
        >
          <p style={{ margin: "0 0 6px", fontSize: 22, opacity: 0.5 }}>📊</p>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 500, color: C.text }}>
            Drop your Excel file here
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.muted }}>or click to browse · .xlsx .xls .csv</p>
        </div>
      )}

      <MsgBanner msg={err} onClose={() => setErr("")} />

      {/* Preview table */}
      {preview && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{preview.length} products found</p>
            <button type="button" onClick={() => setPreview(null)} style={S.btnGhost}>Clear</button>
          </div>

          {/* Merge mode selector */}
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            {[
              ["replace", "Replace all existing products"],
              ["merge",   "Merge (keep existing, add/update from file)"],
            ].map(([val, lbl]) => (
              <label key={val} style={{
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                fontSize: 13, color: mode === val ? C.gold : C.muted, fontFamily: font.sans,
              }}>
                <input type="radio" value={val} checked={mode === val}
                  onChange={() => setMode(val)} style={{ accentColor: C.gold }} />
                {lbl}
              </label>
            ))}
          </div>

          <div style={{
            overflowX: "auto", border: `1px solid ${C.border}`,
            borderRadius: 10, maxHeight: 220, overflowY: "auto",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0 }}>
                <tr style={{ background: C.surface2 }}>
                  {["ID", "Name", "Brand", "Price", "Category", "Sizes", "Badge"].map(h => (
                    <th key={h} style={{
                      padding: "8px 12px", textAlign: "left", color: C.muted,
                      fontWeight: 700, fontSize: 11, textTransform: "uppercase",
                      letterSpacing: "0.08em", whiteSpace: "nowrap",
                      borderBottom: `1px solid ${C.border}`,
                    }}>{h}</th>
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
            <button type="button" onClick={handleConfirm} disabled={busy}
              style={{ ...S.btnPrimary, opacity: busy ? 0.6 : 1 }}>
              {busy ? "Uploading…" : `Upload ${preview.length} Products`}
            </button>
            <button type="button" onClick={onClose} style={S.btnGhost}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
