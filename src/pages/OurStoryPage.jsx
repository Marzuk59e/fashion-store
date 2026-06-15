import Footer from "../components/Footer.jsx";

const TIMELINE = [
  {
    year: "2018",
    title: "Founded in Paris",
    description:
      "sanjiiiii was born from a simple belief — that luxury and sustainability are not mutually exclusive. Our founders, disillusioned with fast fashion, set out to build something enduring.",
  },
  {
    year: "2019",
    title: "First Artisan Partnership",
    description:
      "We partnered with three heritage mills in Lyon and Porto, establishing our core supply chain on principles of fair wages, safe conditions, and traceable materials.",
  },
  {
    year: "2021",
    title: "Carbon-Neutral Shipping",
    description:
      "We became one of the first independent luxury brands to achieve fully carbon-neutral shipping across all 60+ countries we serve, partnering with certified offset programmes.",
  },
  {
    year: "2023",
    title: "Annual Supplier Report",
    description:
      "We published our first public supplier transparency report — naming every mill, their location, and their certification status. Accountability, openly.",
  },
  {
    year: "2025",
    title: "100 Artisan Partners",
    description:
      "sanjiiiii now collaborates with over 100 independent craftspeople and heritage mills across Europe and South Asia, each selected for their mastery and ethical commitments.",
  },
];

const VALUES = [
  {
    label: "Enduring Quality",
    body:
      "We reject planned obsolescence. Every garment is designed to last decades, not seasons — cut from fabrics that improve with age and care.",
  },
  {
    label: "Radical Transparency",
    body:
      "We name our suppliers. We publish our practices. We believe customers deserve to know exactly where their clothes come from and who made them.",
  },
  {
    label: "Ethical Craft",
    body:
      "Every piece is made by artisans earning a living wage in safe conditions. We audit partners annually and publicly disclose results.",
  },
  {
    label: "Considered Beauty",
    body:
      "Luxury doesn't require excess. Our aesthetic is quiet, refined, and intentional — beauty rooted in restraint and material honesty.",
  },
];

export default function OurStoryPage({ navigate }) {
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
        <div className="legal-kicker">Company</div>
        <div className="legal-h1">Our Story</div>
        <p className="legal-p">
          sanjiiiii was built on the conviction that clothing can be both extraordinary and responsible.
          Here is how we got here — and where we are going.
        </p>

        {/* Timeline */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 400,
            color: "var(--charcoal)", marginBottom: 4, paddingBottom: 12,
            borderBottom: "2px solid var(--charcoal)",
          }}>
            A Brief History
          </h2>

          <div style={{ paddingTop: 8 }}>
            {TIMELINE.map((item, i) => (
              <div
                key={item.year}
                style={{
                  display: "flex", gap: 24,
                  borderBottom: i < TIMELINE.length - 1 ? "1px solid var(--border)" : "none",
                  padding: "20px 0",
                }}
              >
                {/* Year pill */}
                <div style={{ flexShrink: 0, width: 56 }}>
                  <span style={{
                    display: "inline-block",
                    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
                    color: "var(--gold)", background: "transparent",
                    border: "1px solid var(--gold)",
                    padding: "3px 8px",
                  }}>
                    {item.year}
                  </span>
                </div>
                {/* Content */}
                <div>
                  <div style={{
                    fontSize: "0.85rem", fontWeight: 600,
                    color: "var(--charcoal)", marginBottom: 6, lineHeight: 1.4,
                  }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--warm-gray)", lineHeight: 1.85 }}>
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 400,
            color: "var(--charcoal)", marginBottom: 4, paddingBottom: 12,
            borderBottom: "2px solid var(--charcoal)",
          }}>
            What We Stand For
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {VALUES.map((v, i) => (
              <div
                key={v.label}
                style={{
                  padding: "22px 20px",
                  borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                  borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{
                  fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "var(--charcoal)", marginBottom: 8,
                }}>
                  {v.label}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--warm-gray)", lineHeight: 1.85 }}>
                  {v.body}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Founders quote */}
        <div style={{
          margin: "8px 0 40px",
          padding: "28px 32px",
          background: "var(--charcoal)",
          position: "relative",
        }}>
          <div style={{
            fontFamily: "var(--font-serif)", fontSize: "1.3rem", fontWeight: 400,
            color: "var(--cream)", lineHeight: 1.6, marginBottom: 16,
          }}>
            "We didn't start sanjiiiii to make money from fashion. We started it to prove that
            fashion could be made differently."
          </div>
          <div style={{
            fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--gold)", fontWeight: 600,
          }}>
            — The Founders, Paris 2018
          </div>
        </div>

        {/* CTA */}
        <div style={{
          padding: "24px 28px",
          background: "var(--surface)", border: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start",
        }}>
          <p style={{
            fontSize: "0.82rem", fontFamily: "var(--font-serif)", fontWeight: 400,
            color: "var(--charcoal)", margin: 0,
          }}>
            Explore the collection.
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--warm-gray)", margin: 0, lineHeight: 1.7 }}>
            Every piece reflects the values above — crafted by hand, built to last.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 4 }}
            onClick={() => navigate("shop")}
          >
            Shop the Collection
          </button>
        </div>

        {/* Last updated */}
        <p style={{
          marginTop: 32, fontSize: "0.7rem", color: "var(--warm-gray)",
          borderTop: "1px solid var(--border)", paddingTop: 16,
        }}>
          Last updated: June 2025
        </p>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}
