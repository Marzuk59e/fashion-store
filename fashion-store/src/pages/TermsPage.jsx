import Footer from "../components/Footer.jsx";
export default function TermsPage({ navigate }) {
  return (
    <div className="legal-page">
      <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--warm-gray)", marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
        ← Back to Home
      </button>
      <div className="legal-card">
        <div className="legal-kicker">Legal</div>
        <div className="legal-h1">Terms & Conditions</div>
        <p className="legal-p">
          Welcome to sanjiiiii. By using this store, you agree to the following terms.
        </p>
        <ul style={{ paddingLeft: 18 }}>
          <li className="legal-li"><strong>Orders</strong>: placed through this store are saved to your account and processed accordingly.</li>
          <li className="legal-li"><strong>Pricing</strong>: displayed in USD; VAT included where applicable and shown for EU deliveries at checkout.</li>
          <li className="legal-li"><strong>Returns</strong>: accepted within 7 days of delivery for unused items in original condition.</li>
        </ul>
        <div className="legal-note">
          For EU customers: VAT is included where applicable and shown at checkout. Cookie preferences can be updated anytime via your browser settings.
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}
