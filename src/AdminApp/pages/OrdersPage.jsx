import { useMemo, useRef, useState } from "react";
import { C, font, S, ORDER_STATUSES } from "../constants.js";
import StatusBadge from "../components/StatusBadge.jsx";
import ScrollToTop from "../components/ScrollToTop.jsx";

export default function OrdersPage({ orders, onStatusChange, onReload, busy }) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const scrollRef = useRef(null);

  const filtered = useMemo(() =>
    orders.filter(o => {
      const q      = search.toLowerCase();
      const matchQ = !q
        || (o.userEmail     || o.customerEmail)?.toLowerCase().includes(q)
        || (o.userName      || o.customerName)?.toLowerCase().includes(q)
        || o.id?.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || o.status === statusFilter;
      return matchQ && matchS;
    }),
    [orders, search, statusFilter]
  );

  const reloadBtn = (
    <button type="button" onClick={onReload} disabled={busy}
      style={{
        ...S.btnGhost, color: C.gold, borderColor: C.gold,
        minWidth: 110, display: "flex", alignItems: "center", gap: 6,
      }}>
      <span style={{
        display: "inline-block",
        animation: busy ? "spin 1s linear infinite" : "none",
        transformOrigin: "center",
        lineHeight: 1,
      }}>↺</span>
      {busy ? "Reloading…" : "Reload"}
    </button>
  );

  if (orders.length === 0) return (
    <div ref={scrollRef} style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: 0 }}>Orders</h2>
        {reloadBtn}
      </div>
      <p style={{ fontSize: 14, color: C.muted, margin: "0 0 32px" }}>Manage customer orders</p>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: C.muted }}>
        <span style={{ fontSize: 32, opacity: 0.3 }}>📦</span>
        <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No orders yet</p>
        <p style={{ fontSize: 13, margin: 0 }}>Orders will appear here once customers start purchasing.</p>
      </div>
    </div>
  );

  const focus = e => (e.target.style.borderColor = C.gold);
  const blur  = e => (e.target.style.borderColor = C.border2);

  return (
    <div ref={scrollRef} style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: 0 }}>Orders</h2>
        {reloadBtn}
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: "0 0 22px" }}>{orders.length} total orders</p>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <input style={{ ...S.input, flex: 1, minWidth: 200 }}
          placeholder="Search by customer, email, order ID…"
          value={search} onChange={e => setSearch(e.target.value)}
          onFocus={focus} onBlur={blur} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ ...S.input, width: "auto", minWidth: 150, appearance: "none" }}>
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Order ID", "Customer", "Date", "Items", "Total", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: C.muted, fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: font.mono, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => {
              const date = o.createdAt?.toDate
                ? o.createdAt.toDate().toLocaleDateString()
                : o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—";
              return (
                <tr key={o.id}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "13px 14px", color: C.muted, fontFamily: font.mono, fontSize: 11 }}>
                    {o.id?.slice(0, 8)}…
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <p style={{ margin: "0 0 2px", color: C.text, fontWeight: 500 }}>{o.userName || o.customerName || "—"}</p>
                    <p style={{ margin: 0, color: C.muted, fontSize: 11 }}>{o.userEmail || o.customerEmail || ""}</p>
                  </td>
                  <td style={{ padding: "13px 14px", color: C.muted, fontSize: 12 }}>{date}</td>
                  <td style={{ padding: "13px 14px", color: C.muted, textAlign: "center" }}>
                    {o.items?.length ?? "—"}
                  </td>
                  <td style={{ padding: "13px 14px", color: C.gold, fontFamily: font.mono, fontWeight: 600 }}>
                    ${(o.total || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <StatusBadge status={o.status} />
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <select
                      value={o.status}
                      onChange={e => onStatusChange(o.id, e.target.value)}
                      disabled={busy}
                      style={{
                        background: C.surface2, color: C.text,
                        border: `1px solid ${C.border2}`, borderRadius: 6,
                        padding: "4px 8px", fontSize: 12,
                        fontFamily: font.sans, cursor: "pointer",
                      }}>
                      {ORDER_STATUSES.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ScrollToTop scrollRef={scrollRef} />
    </div>
  );
}