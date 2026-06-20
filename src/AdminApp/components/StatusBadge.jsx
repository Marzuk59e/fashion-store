import { font, STATUS_COLORS } from "../constants.js";

export default function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
      textTransform: "uppercase", background: s.bg, color: s.color,
      fontFamily: font.sans, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}
