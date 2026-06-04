import Footer from "../components/Footer.jsx";
export default function PrivacyPage({ navigate }) {
  return (
    <div className="legal-page">
      <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--warm-gray)", marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
        ← Back to Home
      </button>
      <div className="legal-card">
        <div className="legal-kicker">Privacy</div>
        <div className="legal-h1">Privacy Policy</div>
        <p className="legal-p">
          sanjiiiii is a fashion storefront. We minimize personal data collection and only store what is necessary to run your account. Email accounts are secured via OTP verification. Google sign-in syncs your bag, wishlist, and orders to your account via Firestore.
        </p>
        <ul style={{ paddingLeft: 18 }}>
          <li className="legal-li"><strong>Necessary cookies</strong>: required for core functionality and security.</li>
          <li className="legal-li"><strong>Analytics cookies</strong>: optional; help us improve the experience.</li>
          <li className="legal-li"><strong>Marketing cookies</strong>: optional; used for personalized offers.</li>
        </ul>
        <p className="legal-p">
          You can update your cookie preferences anytime by clearing site data in your browser, or using the cookie prompt when it appears.
        </p>
        <div className="legal-note">
          For EU customers: we display pricing transparently, and VAT is included where applicable. VAT breakdown is shown during checkout for EU deliveries.
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

