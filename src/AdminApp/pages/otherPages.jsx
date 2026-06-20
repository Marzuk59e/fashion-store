import { useState } from "react";
import { C, S, font } from "../constants/theme.js";
import MsgBanner from "../components/MsgBanner.jsx";

/* ─── Customers Page ─────────────────────────────────────────── */
export function CustomersPage({ customers, customersLoaded, onLoad, busy, msg, setMsg }) {
  return (
    <div>
      <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: "0 0 5px" }}>Customers</h2>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: "0 0 26px" }}>
        Up to 200 Firebase sign-in users. Local-only accounts are not listed.
      </p>
      <MsgBanner msg={msg} onClose={() => setMsg("")} />
      <button type="button" disabled={busy} onClick={onLoad}
        style={{ ...S.btnGhost, marginBottom: 20, color: customersLoaded ? C.muted : C.gold, borderColor: customersLoaded ? C.border2 : C.gold }}>
        {busy ? "Loading…" : customersLoaded ? "Reload list" : "Load customers"}
      </button>

      {!customersLoaded && !busy && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: C.muted }}>
          <span style={{ fontSize: 30, opacity: 0.35 }}>◉</span>
          <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Customer data not loaded yet</p>
        </div>
      )}

      {customersLoaded && (
        <>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.muted, fontFamily: font.mono, margin: "0 0 14px" }}>
            {customers.length} customers loaded
          </p>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Name", "Email", "Orders", "UID"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: C.muted, fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: font.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.id}
                    style={{ borderBottom: i < customers.length - 1 ? `1px solid ${C.border}` : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "13px 14px", color: C.text, fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.goldBg, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.gold, fontWeight: 700, flexShrink: 0 }}>
                          {(c.name !== "—" ? c.name : c.email)?.[0]?.toUpperCase() || "?"}
                        </div>
                        {c.name}
                      </div>
                    </td>
                    <td style={{ padding: "13px 14px", color: C.muted, fontSize: 12 }}>{c.email}</td>
                    <td style={{ padding: "13px 14px", color: C.text, fontFamily: font.mono, fontWeight: 600 }}>{c.orders}</td>
                    <td style={{ padding: "13px 14px", color: C.muted, fontFamily: font.mono, fontSize: 10 }}>{c.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Stock Requests Page ────────────────────────────────────── */
export function StockRequestsPage({ requests, onFulfill, busy, msg, setMsg }) {
  const pending   = requests.filter(r => r.status !== "fulfilled");
  const fulfilled = requests.filter(r => r.status === "fulfilled");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: 0 }}>Stock Requests</h2>
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
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: font.mono, margin: "0 0 12px" }}>Pending</h3>
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
                  const date = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—";
                  return (
                    <tr key={r.id}
                      style={{ borderBottom: i < pending.length - 1 ? `1px solid ${C.border}` : "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: font.mono, margin: "0 0 12px" }}>Fulfilled</h3>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {fulfilled.map((r, i) => {
                  const date = r.fulfilledAt?.toDate ? r.fulfilledAt.toDate().toLocaleDateString() : "—";
                  return (
                    <tr key={r.id} style={{ borderBottom: i < fulfilled.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <td style={{ padding: "13px 14px" }}>
                        <p style={{ margin: "0 0 2px", color: C.muted, fontWeight: 500 }}>{r.productName || "—"}</p>
                        <p style={{ margin: 0, color: C.muted, fontSize: 11 }}>{r.userEmail || "—"}</p>
                      </td>
                      <td style={{ padding: "13px 14px", color: C.muted, fontSize: 12 }}>Notified: {date}</td>
                      <td style={{ padding: "13px 14px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: C.successBg, color: "#6DBF8A", fontFamily: font.mono }}>✓ Done</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Promo Codes Page ───────────────────────────────────────── */
export function PromoCodesPage({ codes, onSave, onDelete, onToggle, busy, msg, setMsg }) {
  const [form,    setForm]    = useState({ code: "", discount: "10", active: true });
  const [editing, setEditing] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.code.trim()) { setMsg("Please enter a promo code."); return; }
    if (!form.discount || isNaN(Number(form.discount)) || Number(form.discount) <= 0 || Number(form.discount) > 100) {
      setMsg("Discount must be between 1 and 100."); return;
    }
    await onSave(form);
    setForm({ code: "", discount: "10", active: true });
    setEditing(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: 0 }}>Promo Codes</h2>
        <button type="button" onClick={() => setEditing(v => !v)}
          style={{ ...S.btnPrimary, fontSize: 12 }}>
          {editing ? "✕ Cancel" : "+ Add Code"}
        </button>
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: "0 0 26px" }}>
        Manage discount codes for customers
      </p>
      <MsgBanner msg={msg} onClose={() => setMsg("")} />

      {editing && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 28px", marginBottom: 28, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Code</label>
            <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20"
              style={{ padding: "9px 14px", background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: font.mono, borderRadius: 6, width: 160 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Discount %</label>
            <input type="number" min="1" max="100" value={form.discount}
              onChange={e => set("discount", e.target.value)}
              style={{ padding: "9px 14px", background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, borderRadius: 6, width: 100 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Active</label>
            <button type="button" onClick={() => set("active", !form.active)}
              style={{ padding: "9px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: form.active ? C.successBg : C.errorBg, color: form.active ? "#6DBF8A" : "#CF8A8A" }}>
              {form.active ? "✓ Active" : "✕ Inactive"}
            </button>
          </div>
          <button type="button" onClick={handleSubmit} disabled={busy}
            style={{ ...S.btnPrimary, padding: "9px 22px" }}>
            Save Code
          </button>
        </div>
      )}

      {codes.length === 0 && !editing && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: C.muted }}>
          <span style={{ fontSize: 32, opacity: 0.3 }}>🏷️</span>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No promo codes yet</p>
          <p style={{ fontSize: 13, margin: 0 }}>Click "+ Add Code" to create one.</p>
        </div>
      )}

      {codes.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Code", "Discount", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 18px", textAlign: "left", color: C.muted, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: font.mono }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c, i) => (
                <tr key={c.id}
                  style={{ borderBottom: i < codes.length - 1 ? `1px solid ${C.border}` : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ fontFamily: font.mono, fontWeight: 700, color: C.gold, fontSize: 15, letterSpacing: "0.08em" }}>{c.code}</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{c.discount}% off</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <button type="button" onClick={() => onToggle(c.id, c.active)} disabled={busy}
                      style={{ padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: c.active ? C.successBg : C.errorBg, color: c.active ? "#6DBF8A" : "#CF8A8A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {c.active ? "✓ Active" : "✕ Inactive"}
                    </button>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <button type="button" onClick={() => onDelete(c.id)} disabled={busy}
                      style={{ ...S.btnDanger, padding: "5px 14px", fontSize: 11 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
