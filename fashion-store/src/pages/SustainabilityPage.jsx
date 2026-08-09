import Footer from "../components/Footer.jsx";

const PILLARS = [
  {
    title: "Materials",
    items: [
      {
        label: "Organic & Recycled Fibres",
        body: "Over 90% of our fabrics are certified organic cotton, recycled wool, or TENCEL™ Lyocell. We are phasing out all virgin synthetic materials by 2026.",
      },
      {
        label: "No Harmful Chemicals",
        body: "Every fabric is OEKO-TEX® STANDARD 100 certified — meaning it has been tested for over 100 harmful substances and passed at every stage of production.",
      },
      {
        label: "Traceable Supply Chain",
        body: "We publish our full supplier list annually. You can trace any sanjiiiii garment to the mill, the country of origin, and the certification body that audits it.",
      },
    ],
  },
  {
    title: "Production",
    items: [
      {
        label: "Small Batch Manufacturing",
        body: "We produce in small runs — never overstock, never discount to clear warehouses. If a piece sells out, it may not return. This is intentional.",
      },
      {
        label: "Fair Wages, Always",
        body: "All artisan partners are independently audited to verify living wages and safe working conditions. We publish audit summaries in our annual report.",
      },
      {
        label: "Waste Reduction",
        body: "Pattern offcuts are donated to partner schools and independent designers. Less than 2% of our production waste goes to landfill.",
      },
    ],
  },
  {
    title: "Shipping & Packaging",
    items: [
      {
        label: "Carbon-Neutral Shipping",
        body: "All orders — domestic and international — ship carbon neutral via certified offset programmes. We absorb this cost; you never pay a 'green surcharge'.",
      },
      {
        label: "Plastic-Free Packaging",
        body: "Orders are packed in recycled tissue, natural cotton dust bags, and FSC-certified boxes. No plastic wrapping, no foam inserts.",
      },
      {
        label: "Consolidated Shipping",
        body: "We batch orders from the same region where possible to reduce per-parcel emissions. Express shipping is available but we gently encourage standard delivery.",
      },
    ],
  },
  {
    title: "End of Life",
    items: [
      {
        label: "Repair Programme",
        body: "We offer free repair guidance and partner with local tailors worldwide. A loose button or minor seam split should never mean a piece is discarded.",
      },
      {
        label: "Returns Resale",
        body: "Returned items in good condition are resold via our Members Resale section at a reduced price, rather than destroyed or discounted into the grey market.",
      },
      {
        label: "Textile Recycling",
        body: "At genuine end of life, post a worn-out sanjiiiii garment back to us. We partner with industrial fibre recyclers to recover raw material — and give you store credit.",
      },
    ],
  },
];

const METRICS = [
  { value: "90%+", label: "Certified sustainable fibres" },
  { value: "100%", label: "Carbon-neutral deliveries" },
  { value: "<2%", label: "Production waste to landfill" },
  { value: "100+", label: "Audited artisan partners" },
];

export default function SustainabilityPage({ navigate }) {
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
        {/* Header */}
        <div className="legal-kicker">Planet</div>
        <div className="legal-h1">Sustainability</div>
        <p className="legal-p">
          Sustainability is not a marketing position for us — it is a founding constraint. Every
          decision, from fibre selection to final delivery, is made with the planet in mind.
        </p>

        {/* Metrics strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          border: "1px solid var(--border)", marginBottom: 40,
        }}>
          {METRICS.map((m, i) => (
            <div
              key={m.label}
              style={{
                padding: "20px 16px", textAlign: "center",
                borderRight: i < METRICS.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div style={{
                fontFamily: "var(--font-serif)", fontSize: "1.6rem",
                color: "var(--gold)", marginBottom: 4, lineHeight: 1,
              }}>
                {m.value}
              </div>
              <div style={{
                fontSize: "0.65rem", color: "var(--warm-gray)",
                textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1.4,
              }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Pillars */}
        {PILLARS.map((pillar) => (
          <div key={pillar.title} style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 400,
              color: "var(--charcoal)", marginBottom: 4, paddingBottom: 12,
              borderBottom: "2px solid var(--charcoal)",
            }}>
              {pillar.title}
            </h2>
            {pillar.items.map((item, i) => (
              <div
                key={item.label}
                style={{
                  borderBottom: "1px solid var(--border)",
                  padding: "18px 0",
                  display: "flex", gap: 20, alignItems: "flex-start",
                }}
              >
                <div style={{
                  flexShrink: 0, width: 6, height: 6,
                  borderRadius: "50%", background: "var(--gold)",
                  marginTop: 6,
                }} />
                <div>
                  <div style={{
                    fontSize: "0.85rem", fontWeight: 600,
                    color: "var(--charcoal)", marginBottom: 5, lineHeight: 1.4,
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--warm-gray)", lineHeight: 1.85 }}>
                    {item.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Annual report CTA */}
        <div style={{
          margin: "8px 0 40px",
          padding: "24px 28px",
          background: "var(--charcoal)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 20, flexWrap: "wrap",
        }}>
          <div>
            <p style={{
              fontSize: "0.82rem", fontFamily: "var(--font-serif)", fontWeight: 400,
              color: "var(--cream)", margin: "0 0 6px",
            }}>
              Read our Annual Sustainability Report
            </p>
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.6 }}>
              Full supplier list, audit results, and emissions data — published every January.
            </p>
          </div>
          <button
            type="button"
            style={{
              flexShrink: 0, padding: "10px 20px",
              background: "var(--gold)", border: "none", cursor: "pointer",
              fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--charcoal)",
            }}
          >
            Download 2025 Report
          </button>
        </div>

        {/* Bottom CTA */}
        <div style={{
          padding: "24px 28px",
          background: "var(--surface)", border: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start",
        }}>
          <p style={{
            fontSize: "0.82rem", fontFamily: "var(--font-serif)", fontWeight: 400,
            color: "var(--charcoal)", margin: 0,
          }}>
            Have a question about our practices?
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--warm-gray)", margin: 0, lineHeight: 1.7 }}>
            We are happy to go deeper on any of the above. Reach our sustainability team directly.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 4 }}
            onClick={() => navigate("contact")}
          >
            Contact Us
          </button>
        </div>

        <p style={{
          marginTop: 32, fontSize: "0.7rem", color: "var(--warm-gray)",
          borderTop: "1px solid var(--border)", paddingTop: 16,
        }}>
          Last updated: January 2025
        </p>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}
