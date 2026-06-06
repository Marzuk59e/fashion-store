// ─── Footer ───────────────────────────────────────────────────────────────────
export default function Footer({ navigate, navigateShop }) {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">sanj<span className="logo-accent">iiiii</span></div>
          <p className="footer-desc">Luxury fashion curated for the modern connoisseur. Sustainable, ethical, timeless.</p>
        </div>
        <div>
          <div className="footer-col-title">Shop</div>
          {[
  { label: "Women",       filter: "Women" },
  { label: "Men",         filter: "Men" },
  { label: "Kids",        filter: "Kids" },
  { label: "Accessories", filter: "Accessories" },
  { label: "New Arrivals",filter: "All" },
  { label: "Sale",        filter: "All" },
].map(({ label, filter }) => (
  <span key={label} className="footer-link" onClick={() => { navigateShop(filter); }}>{label}</span>
))}
        </div>
        <div>
          <div className="footer-col-title">Help</div>
          {["Shipping & Returns", "Size Guide", "FAQ", "Contact Us", "Stores"].map(l => <span key={l} className="footer-link">{l}</span>)}
          <span className="footer-link" onClick={() => navigate("privacy")}>Privacy Policy</span>
          <span className="footer-link" onClick={() => navigate("terms")}>Terms</span>
          <span className="footer-link" onClick={() => window.dispatchEvent(new Event("velours:cookie-settings"))}>
            Cookie Settings
          </span>
        </div>
        <div>
          <div className="footer-col-title">Company</div>
          {["Our Story", "Sustainability", "Careers", "Press"].map(l => <span key={l} className="footer-link" onClick={() => navigate("about")}>{l}</span>)}
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">© 2026 sanjiiiii. All rights reserved.</span>
        <div className="footer-socials">
          {["𝕏", "in", "ig", "fb"].map(s => <div key={s} className="social-btn">{s}</div>)}
        </div>
      </div>
    </footer>
  );
}

