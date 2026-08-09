import { C, font } from "../constants.js";

export default function MsgBanner({ msg, onClose }) {
  if (!msg) return null;
  const isErr  = /fail|invalid|error|denied|could not|not found/i.test(msg);
  const isWarn = /warn|reset|default/i.test(msg);
  const bg     = isErr ? C.errorBg   : isWarn ? C.warningBg   : C.successBg;
  const border = isErr ? C.error     : isWarn ? C.warning      : C.success;
  const color  = isErr ? "#CF8A8A"   : isWarn ? "#E2BC5C"      : "#8BCF9A";
  const icon   = isErr ? "⚠"         : isWarn ? "◌"            : "✓";

  return (
    <div style={{
      padding: "11px 16px", borderRadius: 8, marginBottom: 16,
      background: bg, border: `1px solid ${border}44`,
      color, fontSize: 15, fontFamily: font.sans,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span>{icon} {msg}</span>
      {onClose && (
        <button onClick={onClose}
          style={{ background: "none", border: "none", color, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>
          ×
        </button>
      )}
    </div>
  );
}
