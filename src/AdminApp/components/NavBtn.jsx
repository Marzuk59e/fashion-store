import { useState } from "react";
import { C, font } from "../constants.js";

export default function NavBtn({ id, label, icon, active, onClick, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "10px 18px",
        background:  active ? C.goldBg : hov ? "rgba(255,255,255,0.025)" : "transparent",
        border: "none",
        borderLeft: `2px solid ${active ? C.gold : "transparent"}`,
        color:       active ? C.gold   : hov ? C.text : C.muted,
        fontSize: 15, fontFamily: font.sans,
        fontWeight: active ? 800 : 600,
        letterSpacing: "0.07em", textTransform: "uppercase",
        cursor: "pointer", textAlign: "left", transition: "all 0.15s",
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
      {badge > 0 && (
        <span style={{
          marginLeft: "auto", minWidth: 20, height: 20, borderRadius: 10,
          background: C.gold, color: "#0C0B09", fontSize: 10, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px",
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}
