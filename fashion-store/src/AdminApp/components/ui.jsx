import { C, font, S, STATUS_COLORS } from "../constants/theme.js";

/* ─── StatCard ───────────────────────────────────────────────── */
export function StatCard({ label, value, sub, accent = C.gold }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${accent}`, borderRadius: 12,
      padding: "18px 22px", flex: 1, minWidth: 140,
    }}>
      <p style={{
        margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: C.muted,
        textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: font.sans,
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
        <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 500, color: C.muted }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ─── StatusBadge ────────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      background: s.bg, color: s.color,
      fontFamily: font.sans, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

/* ─── FormField ──────────────────────────────────────────────── */
export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

/* ─── AccessDenied ───────────────────────────────────────────── */
export function AccessDenied({ user, storefrontUrl, onLogout }) {
  const codeTagStyle = {
    color: "#E2BC5C", fontSize: 12, fontWeight: 700,
    background: "rgba(226,188,92,0.12)",
    padding: "2px 7px", borderRadius: 4, letterSpacing: "0.01em",
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: font.sans, padding: 24,
    }}>
      <div style={{
        maxWidth: 520, background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: "40px 36px",
      }}>
        <p style={{ margin: "0 0 16px", fontSize: 26 }}>⛔</p>
        <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 500, color: C.text }}>
          Access Denied
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
          Your account (<span style={{ color: C.text }}>{user.email || user.uid}</span>)
          is not in the <code style={codeTagStyle}>admins</code> collection.
        </p>
        <div style={{
          background: C.bg, border: `1px solid ${C.border2}`,
          borderRadius: 10, padding: "16px 20px", marginBottom: 24,
        }}>
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
          <a href={storefrontUrl} style={{ ...S.btnGhost, textDecoration: "none", display: "inline-block" }}>
            ← Storefront
          </a>
        </div>
      </div>
    </div>
  );
}
