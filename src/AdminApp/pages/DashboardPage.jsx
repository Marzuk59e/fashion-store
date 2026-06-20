import { C, font } from "../constants.js";
import StatCard from "../components/StatCard.jsx";

export default function DashboardPage({ products, customers, customersLoaded, orders }) {
  const totalRevenue  = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  return (
    <div>
      <h2 style={{ fontSize: 34, fontWeight: 500, color: C.text, fontFamily: font.serif, margin: "0 0 5px" }}>
        Overview
      </h2>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: "0 0 26px" }}>
        Live from Firestore · <span style={{ color: C.gold }}>catalog/store</span>
      </p>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Products Live"       value={products.length} />
        <StatCard label="Customers"           value={customersLoaded ? customers.length : "—"} accent="#5A7D8A" />
        <StatCard label="Total Orders"        value={orders.length}   accent="#7A6090" />
        <StatCard label="Pending Orders"      value={pendingOrders}   accent="#8B6E2A"
          sub={pendingOrders > 0 ? "Need action" : "All clear"} />
        <StatCard label="Revenue (Delivered)" value={`$${totalRevenue.toLocaleString()}`} accent="#4A7C59" />
      </div>

      {/* Quick guide */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: "22px 26px", maxWidth: 600,
      }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: C.muted,
          textTransform: "uppercase", letterSpacing: "0.12em",
          fontFamily: font.mono, margin: "0 0 20px",
        }}>
          Quick guide
        </p>
        {[
          { n: "01", t: "Edit products",      d: "Go to Products tab to add, edit, or delete products. Use Excel upload for bulk." },
          { n: "02", t: "Manage orders",      d: "View and update order statuses in the Orders tab. Change from pending → shipped etc." },
          { n: "03", t: "View customers",     d: "Load up to 200 Firebase sign-in users from the Customers tab." },
          { n: "04", t: "Grant admin access", d: "Create admins/<Firebase UID> in Firestore with active: true." },
        ].map(({ n, t, d }) => (
          <div key={n} style={{ display: "flex", gap: 14, marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: font.mono, minWidth: 18, paddingTop: 3 }}>
              {n}
            </span>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 5px" }}>{t}</p>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: 0 }}>{d}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4CAF7C", display: "inline-block" }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: C.muted }}>
          Store is live · Connected to Firebase
        </span>
      </div>
    </div>
  );
}
