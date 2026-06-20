import { C, font } from "../constants.js";

export default function LoadingScreen({ text = "Loading…" }) {
  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16,
    }}>
      <div style={{
        width: 34, height: 34, border: `2px solid ${C.border2}`,
        borderTopColor: C.gold, borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: C.muted, fontSize: 13, fontFamily: font.sans, margin: 0 }}>{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
