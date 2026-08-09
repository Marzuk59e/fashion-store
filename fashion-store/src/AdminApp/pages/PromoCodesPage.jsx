import { useState } from "react";
import { C, font, S } from "../constants.js";
import MsgBanner from "../components/MsgBanner.jsx";
import FormField from "../components/FormField.jsx";

const DEFAULT_FORM = { code: "", discount: 10, active: true };

export default function PromoCodesPage({ codes, onSave, onDelete, onToggle, busy, msg, setMsg }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.code.trim()) return;
    onSave(form);
    setForm(DEFAULT_FORM);
  };

  const focus = e => (e.target.style.borderColor = C.gold);
  const blur  = e => (e.target.style.borderColor = C.border2);

  return (
    <div>
      <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: "0 0 5px" }}>
        Promo Codes
      </h2>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: "0 0 26px" }}>
        Create and manage discount codes
      </p>

      <MsgBanner msg={msg} onClose={() => setMsg("")} />

      {/* Add new code form */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 26px", marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: font.mono, margin: "0 0 16px" }}>
          New Promo Code
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 140 }}>
            <FormField label="Code">
              <input style={S.input} placeholder="SUMMER25"
                value={form.code}
                onChange={e => set("code", e.target.value.toUpperCase())}
                onFocus={focus} onBlur={blur} />
            </FormField>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <FormField label="Discount %">
              <input type="number" style={S.input} value={form.discount}
                onChange={e => set("discount", Number(e.target.value))}
                onFocus={focus} onBlur={blur} />
            </FormField>
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <FormField label="Status">
              <select style={{ ...S.input, appearance: "none" }}
                value={String(form.active)}
                onChange={e => set("active", e.target.value === "true")}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </FormField>
          </div>
          <div style={{ paddingBottom: 14 }}>
            <button type="button" onClick={handleSubmit} disabled={busy}
              style={{ ...S.btnPrimary, opacity: busy ? 0.6 : 1, whiteSpace: "nowrap" }}>
              {busy ? "Saving…" : "Save Code"}
            </button>
          </div>
        </div>
      </div>

      {/* Codes table */}
      {codes.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 120, gap: 10, color: C.muted }}>
          <span style={{ fontSize: 28, opacity: 0.3 }}>🏷</span>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No promo codes yet</p>
        </div>
      )}

      {codes.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Code", "Discount", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 18px", textAlign: "left", color: C.muted, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: font.mono }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c, i) => (
                <tr key={c.id}
                  style={{ borderBottom: i < codes.length - 1 ? `1px solid ${C.border}` : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ fontFamily: font.mono, fontWeight: 700, color: C.gold, fontSize: 15, letterSpacing: "0.08em" }}>
                      {c.code}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{c.discount}% off</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <button type="button" onClick={() => onToggle(c.id, c.active)} disabled={busy}
                      style={{
                        padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                        fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em",
                        background: c.active ? C.successBg : C.errorBg,
                        color:      c.active ? "#6DBF8A"   : "#CF8A8A",
                      }}>
                      {c.active ? "✓ Active" : "✕ Inactive"}
                    </button>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <button type="button" onClick={() => onDelete(c.id)} disabled={busy}
                      style={{ ...S.btnDanger, padding: "5px 14px", fontSize: 11 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
