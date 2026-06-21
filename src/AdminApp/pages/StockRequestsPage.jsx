import { C, font, S } from "../constants.js";
import MsgBanner from "../components/MsgBanner.jsx";
import ScrollToTop from "../components/ScrollToTop.jsx";

export default function StockRequestsPage({ requests, onFulfill, busy, msg, setMsg }) {
  const pending   = requests.filter(r => r.status !== "fulfilled");
  const fulfilled = requests.filter(r => r.status === "fulfilled");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: 0 }}>
          Stock Requests
        </h2>
        {pending.length > 0 && (
          <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(226,188,92,0.15)", color: C.gold }}>
            {pending.length} pending
          </span>
        )}
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: "0 0 26px" }}>
        Customer restock requests — notify them when available
      </p>

      <MsgBanner msg={msg} onClose={() => setMsg("")} />

      {requests.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: C.muted }}>
          <span style={{ fontSize: 32, opacity: 0.3 }}>📦</span>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No stock requests yet</p>
          <p style={{ fontSize: 13, margin: 0 }}>Customers can request restocks from out-of-stock product pages.</p>
        </div>
      )}

      {pending.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: font.mono, margin: "0 0 12px" }}>
            Pending
          </h3>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 32 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Product", "Customer", "Date", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: C.muted, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: font.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((r, i) => {
                  const date = r.createdAt?.toDate
                    ? r.createdAt.toDate().toLocaleDateString()
                    : r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—";
                  return (
                    <tr key={r.id}
                      style={{ borderBottom: i < pending.length - 1 ? `1px solid ${C.border}` : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "13px 14px" }}>
                        <p style={{ margin: "0 0 2px", color: C.text, fontWeight: 500 }}>{r.productName || "—"}</p>
                        <p style={{ margin: 0, color: C.muted, fontSize: 11, fontFamily: font.mono }}>ID: {r.productId}</p>
                      </td>
                      <td style={{ padding: "13px 14px" }}>
                        <p style={{ margin: "0 0 2px", color: C.text }}>{r.userName || "—"}</p>
                        <p style={{ margin: 0, color: C.muted, fontSize: 11 }}>{r.userEmail || "—"}</p>
                      </td>
                      <td style={{ padding: "13px 14px", color: C.muted, fontSize: 12 }}>{date}</td>
                      <td style={{ padding: "13px 14px" }}>
                        <button type="button" disabled={busy}
                          onClick={() => onFulfill(r.id, r.productId, r.userId, r.productName)}
                          style={{ ...S.btnPrimary, padding: "7px 16px", fontSize: 11 }}>
                          Notify Customer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {fulfilled.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: font.mono, margin: "0 0 12px" }}>
            Fulfilled
          </h3>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {fulfilled.map((r, i) => {
                  const date = r.fulfilledAt?.toDate ? r.fulfilledAt.toDate().toLocaleDateString() : "—";
                  return (
                    <tr key={r.id}
                      style={{ borderBottom: i < fulfilled.length - 1 ? `1px solid ${C.border}` : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "13px 14px" }}>
                        <p style={{ margin: "0 0 2px", color: C.muted, fontWeight: 500 }}>{r.productName || "—"}</p>
                        <p style={{ margin: 0, color: C.muted, fontSize: 11, fontFamily: font.mono }}>ID: {r.productId}</p>
                      </td>
                      <td style={{ padding: "13px 14px" }}>
                        <p style={{ margin: "0 0 2px", color: C.muted }}>{r.userName || "—"}</p>
                        <p style={{ margin: 0, color: C.muted, fontSize: 11 }}>{r.userEmail || "—"}</p>
                      </td>
                      <td style={{ padding: "13px 14px", color: C.muted, fontSize: 12 }}>{date}</td>
                      <td style={{ padding: "13px 14px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(74,124,89,0.2)", color: "#6DBF8A" }}>
                          ✓ Notified
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ScrollToTop />
    </div>
  );
}