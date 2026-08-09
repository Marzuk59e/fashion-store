/* ─── Design tokens ────────────────────────────────────────── */
export const C = {
  cream: "#0C0B09",
  charcoal: "#F5F0E8",
  bg: "#0C0B09",
  surface: "#141310",
  surface2: "#1C1A16",
  border: "#252219",
  border2: "#302C22",
  gold: "#F0CC6A",
  goldBg: "rgba(226,188,92,0.10)",
  text: "#FFFFFF",
  warmGray: "#C4B9A8",
  muted: "#C4B9A8",
  success: "#4A7C59",
  successBg: "rgba(74,124,89,0.12)",
  error: "#8B3A3A",
  errorBg: "rgba(139,58,58,0.12)",
  warning: "#7A6020",
  warningBg: "rgba(226,188,92,0.12)",
};

export const font = {
  serif: "'Cormorant Garamond', Georgia, serif",
  mono: "'Fira Code', 'Courier New', monospace",
  sans: "'DM Sans', system-ui, sans-serif",
};

export const CATEGORIES = ["Women", "Men", "Kids", "Accessories"];
export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export const STATUS_COLORS = {
  pending:    { bg: "rgba(226,188,92,0.15)",  color: "#E2BC5C" },
  processing: { bg: "rgba(90,125,138,0.2)",   color: "#7AAEC0" },
  shipped:    { bg: "rgba(74,124,89,0.2)",    color: "#6DBF8A" },
  delivered:  { bg: "rgba(74,124,89,0.3)",    color: "#4CAF7C" },
  cancelled:  { bg: "rgba(139,58,58,0.2)",    color: "#CF8A8A" },
};

/* ─── Admin secret key ─────────────────────────────── */
// Change this to a strong secret before going live!
export const ADMIN_SECRET_KEY = import.meta.env.VITE_ADMIN_SECRET_KEY ?? "sanjiiiii-admin-2025";
export const BYPASS_AUTH = false;

/* ─── Shared button/input styles ────────────────────────────── */
export const S = {
  btnPrimary: {
    padding: "14px 24px", background: C.gold, border: "none", borderRadius: 4,
    color: "#FFFFFF", fontSize: 13, fontWeight: 700, fontFamily: font.sans,
    letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer",
  },
  btnGhost: {
    padding: "10px 18px", background: "transparent", border: `1px solid ${C.border2}`,
    borderRadius: 8, color: C.muted, fontSize: 12, fontWeight: 600,
    fontFamily: font.sans, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
  },
  btnDanger: {
    padding: "8px 14px", background: C.errorBg, border: `1px solid ${C.error}55`,
    borderRadius: 7, color: "#CF8A8A", fontSize: 12, fontWeight: 600,
    fontFamily: font.sans, cursor: "pointer",
  },
  input: {
    width: "100%", padding: "14px 16px", background: "#0C0B09", color: C.text,
    border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 16,
    fontFamily: font.sans, outline: "none", boxSizing: "border-box",
  },
  label: {
    fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase",
    letterSpacing: "0.08em", marginBottom: 5, display: "block",
  },
};
