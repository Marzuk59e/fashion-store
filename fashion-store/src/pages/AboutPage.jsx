import Footer from "../components/Footer.jsx";
// ─── About Page ───────────────────────────────────────────────────────────────
export default function AboutPage({ navigate }) {
  return (
    <div>
      <div className="about-hero">
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 20 }}>Est. 2018</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2.5rem,6vw,5rem)", color: "var(--cream)", fontWeight: 300, lineHeight: 1.1 }}>Fashion with<br /><em style={{ color: "var(--gold-light)" }}>Purpose</em></h1>
      </div>
      <div className="about-body">
        {[["Our Story", "sanjiiiii was born from a simple belief: that luxury and sustainability are not mutually exclusive. Founded in Paris in 2018, we source only from artisans who share our commitment to ethical production and enduring quality."],
        ["Our Philosophy", "We reject the notion of fast fashion. Every piece in our collection is designed to be worn for decades, not seasons. We work with heritage mills and independent craftspeople to ensure each garment tells a story of skilled hands and considered materials."],
        ["Sustainability", "We are committed to reducing our environmental footprint at every step. From our organic and recycled materials to our carbon-neutral shipping, every decision is made with the planet in mind."]].map(([title, body], i) => (
          <div key={title} style={{ marginBottom: 56, paddingBottom: 56, borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: 400, marginBottom: 16 }}>{title}</h2>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.9, color: "var(--warm-gray)" }}>{body}</p>
          </div>
        ))}
        <div style={{ textAlign: "center" }}>
          <button className="btn-primary" onClick={() => navigate("shop")}>Shop the Collection</button>
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

