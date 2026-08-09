import { useMemo, useState } from "react";
import { C, font, S } from "../constants.js";
import MsgBanner from "../components/MsgBanner.jsx";
import ScrollToTop from "../components/ScrollToTop.jsx";

export default function CustomersPage({ customers, customersLoaded, onLoad, busy, msg, setMsg }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.email?.toLowerCase().includes(q) ||
      c.displayName?.toLowerCase().includes(q) ||
      c.uid?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const focus = e => (e.target.style.borderColor = C.gold);
  const blur  = e => (e.target.style.borderColor = C.border2);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: "0 0 4px" }}>Customers</h2>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: 0 }}>
            {customersLoaded ? `${customers.length} users loaded` : "Firebase Auth users"}
          </p>
        </div>
        <button type="button" onClick={onLoad} disabled={busy}
          style={{ ...S.btnPrimary, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Loading…" : customersLoaded ? "Reload" : "Load Customers"}
        </button>
      </div>

      <MsgBanner msg={msg} onClose={() => setMsg("")} />

      {!customersLoaded && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: C.muted }}>
          <span style={{ fontSize: 32, opacity: 0.3 }}>◉</span>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Click "Load Customers" to fetch up to 200 users</p>
        </div>
      )}

      {customersLoaded && (
        <>
          <input
            style={{ ...S.input, marginBottom: 16 }}
            placeholder="Search by email, name, or UID…"
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={focus} onBlur={blur}
          />
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Email", "Display Name", "UID", "Joined", "Last Sign In"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: C.muted, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: font.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: C.muted }}>
                      No customers found
                    </td>
                  </tr>
                )}
                {filtered.map((c, i) => (
                  <tr key={c.uid}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "13px 14px", color: C.text }}>{c.email || "—"}</td>
                    <td style={{ padding: "13px 14px", color: C.muted }}>{c.displayName || "—"}</td>
                    <td style={{ padding: "13px 14px", color: C.muted, fontFamily: font.mono, fontSize: 11 }}>
                      {c.uid?.slice(0, 12)}…
                    </td>
                    <td style={{ padding: "13px 14px", color: C.muted, fontSize: 12 }}>
                      {c.metadata?.creationTime ? new Date(c.metadata.creationTime).toLocaleDateString() : c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "13px 14px", color: C.muted, fontSize: 12 }}>
                      {c.metadata?.lastSignInTime ? new Date(c.metadata.lastSignInTime).toLocaleDateString() : c.lastSeen?.toDate ? c.lastSeen.toDate().toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ScrollToTop />
    </div>
  );
}
