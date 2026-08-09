import Footer from "../components/Footer.jsx";

// ─── Shipping & Returns Page ──────────────────────────────────────────────────
export default function ShippingPage({ navigate }) {
  return (
    <div className="legal-page">
      <button
        onClick={() => navigate("home")}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase",
          color: "var(--warm-gray)", marginBottom: 24, display: "flex", alignItems: "center", gap: 6,
        }}
      >
        ← Back to Home
      </button>

      <div className="legal-card">
        <div className="legal-kicker">Delivery</div>
        <div className="legal-h1">Shipping &amp; Returns</div>
        <p className="legal-p">
          We partner with premium carriers to ensure your order arrives safely and on time. Every order is carefully packaged in our signature recycled materials.
        </p>

        {/* Shipping Options */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 400,
            color: "var(--charcoal)", marginBottom: 20, paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
          }}>
            Shipping Options
          </h2>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              {
                icon: "🚚",
                title: "Standard Delivery",
                time: "3–5 business days",
                price: "$8",
                note: "Free on orders over $200",
              },
              {
                icon: "⚡",
                title: "Express Delivery",
                time: "1–2 business days",
                price: "$20",
                note: "Order before 12pm for same-day dispatch",
              },
              {
                icon: "🌍",
                title: "International",
                time: "5–10 business days",
                price: "From $25",
                note: "Duties & taxes may apply at destination",
              },
            ].map(({ icon, title, time, price, note }) => (
              <div key={title} style={{
                display: "flex", gap: 18, alignItems: "flex-start",
                padding: "18px 20px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
              }}>
                <span style={{ fontSize: "1.4rem", flexShrink: 0, marginTop: 2 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", flexWrap: "wrap", gap: 4,
                    marginBottom: 4,
                  }}>
                    <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--charcoal)" }}>{title}</span>
                    <span style={{
                      fontSize: "0.82rem", fontWeight: 700, color: "var(--gold)",
                      fontFamily: "var(--font-serif)",
                    }}>{price}</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--charcoal)", marginBottom: 4 }}>{time}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--warm-gray)", fontStyle: "italic" }}>{note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Returns Policy */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 400,
            color: "var(--charcoal)", marginBottom: 20, paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
          }}>
            Returns Policy
          </h2>
          <div style={{ display: "grid", gap: 16 }}>
            {[
              {
                step: "01",
                title: "30-Day Returns",
                body: "Return any unworn item within 30 days of delivery. Items must have original tags attached and be in original condition.",
              },
              {
                step: "02",
                title: "Free Return Shipping",
                body: "We cover the return shipping cost for all orders within the US, UK, and EU. A prepaid label will be emailed to you.",
              },
              {
                step: "03",
                title: "Refund Timeline",
                body: "Refunds are processed within 3–5 business days of us receiving the item. Your bank may take an additional 2–4 days.",
              },
              {
                step: "04",
                title: "Exchanges",
                body: "Want a different size or colour? Contact us within 7 days of delivery and we'll arrange an exchange free of charge.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} style={{ display: "flex", gap: 18 }}>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 700, color: "var(--gold)",
                  fontFamily: "var(--font-mono, monospace)", minWidth: 22, paddingTop: 2, flexShrink: 0,
                }}>{step}</span>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--charcoal)", marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--warm-gray)", lineHeight: 1.8 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Non-returnable */}
        <div className="legal-note" style={{ marginBottom: 32 }}>
          <strong style={{ color: "var(--charcoal)" }}>Non-returnable items:</strong> Swimwear, intimates, and pierced jewellery cannot be returned for hygiene reasons. Sale items marked "Final Sale" are not eligible for returns.
        </div>

        {/* Tracking */}
        <div style={{ marginBottom: 0 }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 400,
            color: "var(--charcoal)", marginBottom: 14, paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
          }}>
            Order Tracking
          </h2>
          <p className="legal-p" style={{ marginBottom: 0 }}>
            Once your order ships, you'll receive a tracking link by email. You can also view your order status at any time from your{" "}
            <span
              onClick={() => navigate("profile")}
              style={{ color: "var(--gold)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              account page
            </span>.
          </p>
        </div>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}
