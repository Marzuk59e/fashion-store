import { C, font, S } from "../constants.js";

export default function AccessDenied({ user, storefrontUrl, onLogout }) {
  const codeTag = {
    color: "#E2BC5C", fontSize: 12, fontWeight: 700,
    background: "rgba(226,188,92,0.12)", padding: "2px 7px",
    borderRadius: 4, letterSpacing: "0.01em",
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: font.sans, padding: 24,
    }}>
      <div style={{
        maxWidth: 520, background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: 16, padding: "40px 36px",
      }}>
        <p style={{ margin: "0 0 16px", fontSize: 26 }}>⛔</p>
        <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 500, color: C.text }}>
          Access Denied
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
          Your account (<span style={{ color: C.text }}>{user.email || user.uid}</span>) is not
          in the <code style={codeTag}>admins</code> collection.
        </p>
        <div style={{
          background: C.bg, border: `1px solid ${C.border2}`,
          borderRadius: 10, padding: "16px 20px", marginBottom: 24,
        }}>
          <ol style={{ margin: 0, paddingLeft: 20, color: C.text, fontSize: 13, lineHeight: 1.9 }}>
            <li>Open Firebase Console → Firestore.</li>
            <li>Create collection <strong style={{ color: C.gold }}>admins</strong> (if missing).</li>
            <li>Add document ID: <code style={codeTag}>{user.uid}</code></li>
            <li>Set field <code style={codeTag}>active</code> = <strong>true</strong>.</li>
            <li>Refresh this page.</li>
          </ol>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" onClick={onLogout} style={S.btnGhost}>Sign out</button>
          <a href={storefrontUrl}
            style={{ ...S.btnGhost, textDecoration: "none", display: "inline-block" }}>
            ← Storefront
          </a>
        </div>
      </div>
    </div>
  );
}
