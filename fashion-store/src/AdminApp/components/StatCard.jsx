import { C, font } from "../constants.js";

export default function StatCard({ label, value, sub, accent = C.gold }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${accent}`, borderRadius: 12,
      padding: "18px 22px", flex: 1, minWidth: 140,
    }}>
      <p style={{
        margin: "0 0 6px", fontSize: 14, fontWeight: 700,
        color: C.muted, textTransform: "uppercase",
        letterSpacing: "0.12em", fontFamily: font.sans,
      }}>
        {label}
      </p>
      <p style={{
        margin: 0, fontSize: 44, fontWeight: 700, color: C.text,
        fontFamily: "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        fontVariantNumeric: "tabular-nums lining-nums",
        letterSpacing: "0.01em", lineHeight: 1,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 500, color: C.muted }}>{sub}</p>
      )}
    </div>
  );
}
