import Footer from "../components/Footer.jsx";

const PRESS_FEATURES = [
  {
    year: "2025",
    items: [
      {
        publication: "Financial Times",
        title: "The quiet luxury brands rewriting fashion's rulebook",
        date: "March 2025",
        excerpt:
          "sanjiiiii is named among a new generation of labels proving that restraint, transparency, and genuine craft are commercially viable alternatives to the hype cycle.",
      },
      {
        publication: "Vogue Business",
        title: "How independent brands are outpacing heritage houses on sustainability",
        date: "January 2025",
        excerpt:
          "With a supplier transparency report that names every mill and publishes audit results, sanjiiiii has set a new benchmark for what accountability looks like in luxury fashion.",
      },
    ],
  },
  {
    year: "2024",
    items: [
      {
        publication: "The Guardian",
        title: "Fashion that lasts: the brands building for decades, not seasons",
        date: "October 2024",
        excerpt:
          "Against a backdrop of accelerating trend cycles, sanjiiiii insists on small-batch production, lifetime repair guidance, and a refusal to ever discount — a bet on longevity over virality.",
      },
      {
        publication: "Business of Fashion",
        title: "Carbon-neutral from click to doorstep: inside sanjiiiii's logistics model",
        date: "May 2024",
        excerpt:
          "Every order ships carbon-neutral at no extra charge to the customer. A detailed look at how the brand absorbs offset costs and why it believes this is simply the right price of doing business.",
      },
      {
        publication: "Dezeen",
        title: "The aesthetic of considered restraint",
        date: "February 2024",
        excerpt:
          "sanjiiiii's visual identity — sparse, serif-led, quietly confident — is as intentional as its supply chain. The brand's design philosophy is profiled in full.",
      },
    ],
  },
  {
    year: "2023",
    items: [
      {
        publication: "Monocle",
        title: "Less is more: the case for buying one remarkable thing",
        date: "September 2023",
        excerpt:
          "Featured in Monocle's annual quality of life issue as an exemplar of the slow fashion movement — a brand that would rather sell you one jacket than ten.",
      },
      {
        publication: "Wallpaper*",
        title: "New luxury, new values",
        date: "April 2023",
        excerpt:
          "As part of a feature on emerging European luxury, sanjiiiii is praised for its approach to material selection and its insistence on publishing supplier data at a level of detail rare even among established houses.",
      },
    ],
  },
];

const AWARDS = [
  { year: "2025", award: "Sustainable Brand of the Year", body: "Fashion Positive Awards" },
  { year: "2024", award: "Best Independent Luxury Label", body: "Business of Fashion 500" },
  { year: "2024", award: "Supply Chain Transparency Award", body: "Ethical Fashion Forum" },
  { year: "2023", award: "Emerging Brand of the Year", body: "Monocle Design Awards" },
];

export default function PressPage({ navigate }) {
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
        <div className="legal-kicker">Media</div>
        <div className="legal-h1">Press</div>
        <p className="legal-p">
          Press enquiries, interview requests, and high-resolution assets are all available via our
          press team. A selection of recent coverage is listed below.
        </p>

        {/* Press kit CTA */}
        <div style={{
          display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40,
        }}>
          <button
            type="button"
            className="btn-primary"
          >
            Download Press Kit
          </button>
          <button
            type="button"
            onClick={() => navigate("contact")}
            style={{
              padding: "10px 20px", fontSize: "0.65rem", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              border: "1px solid var(--charcoal)", background: "transparent",
              color: "var(--charcoal)", cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Contact Press Team
          </button>
        </div>

        {/* Coverage by year */}
        {PRESS_FEATURES.map((group) => (
          <div key={group.year} style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 400,
              color: "var(--charcoal)", marginBottom: 4, paddingBottom: 12,
              borderBottom: "2px solid var(--charcoal)",
            }}>
              {group.year}
            </h2>

            {group.items.map((item, i) => (
              <div
                key={item.title}
                style={{
                  borderBottom: "1px solid var(--border)",
                  padding: "20px 0",
                  display: "flex", gap: 20,
                }}
              >
                {/* Publication badge */}
                <div style={{ flexShrink: 0, minWidth: 100 }}>
                  <div style={{
                    fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "var(--charcoal)",
                    border: "1px solid var(--border)", padding: "4px 8px",
                    display: "inline-block", lineHeight: 1.4,
                  }}>
                    {item.publication}
                  </div>
                  <div style={{
                    fontSize: "0.65rem", color: "var(--warm-gray)",
                    marginTop: 6, letterSpacing: "0.04em",
                  }}>
                    {item.date}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <div style={{
                    fontSize: "0.85rem", fontWeight: 600,
                    color: "var(--charcoal)", marginBottom: 6, lineHeight: 1.4,
                  }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--warm-gray)", lineHeight: 1.8 }}>
                    {item.excerpt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Awards */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 400,
            color: "var(--charcoal)", marginBottom: 4, paddingBottom: 12,
            borderBottom: "2px solid var(--charcoal)",
          }}>
            Awards & Recognition
          </h2>
          {AWARDS.map((a, i) => (
            <div
              key={a.award}
              style={{
                display: "flex", alignItems: "center", gap: 20,
                padding: "14px 0", borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{
                flexShrink: 0, fontSize: "0.65rem", fontWeight: 700,
                color: "var(--gold)", letterSpacing: "0.08em", width: 36,
              }}>
                {a.year}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--charcoal)", marginBottom: 2 }}>
                  {a.award}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--warm-gray)" }}>{a.body}</div>
              </div>
              <div style={{
                flexShrink: 0, fontSize: "1rem", color: "var(--gold)",
              }}>
                ✦
              </div>
            </div>
          ))}
        </div>

        {/* Enquiry CTA */}
        <div style={{
          marginTop: 8, padding: "24px 28px",
          background: "var(--surface)", border: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start",
        }}>
          <p style={{
            fontSize: "0.82rem", fontFamily: "var(--font-serif)", fontWeight: 400,
            color: "var(--charcoal)", margin: 0,
          }}>
            Press enquiries
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--warm-gray)", margin: 0, lineHeight: 1.7 }}>
            For interviews, brand assets, product samples, or comment requests, please reach our press team.
            We aim to respond within one business day.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 4 }}
            onClick={() => navigate("contact")}
          >
            Press Enquiry
          </button>
        </div>

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
