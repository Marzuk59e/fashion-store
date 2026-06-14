// ─── Footer ───────────────────────────────────────────────────────────────────
export default function Footer({ navigate }) {
  return (
    <footer
      className="footer"
      style={{
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginTop: "80px",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div className="footer-grid">
        <div>
          <div className="footer-brand">sanj<span className="logo-accent">iiiii</span></div>
          <p className="footer-desc">Luxury fashion curated for the modern connoisseur. Sustainable, ethical, timeless.</p>
        </div>
        <div>
          <div className="footer-col-title">Shop</div>
          {[
            { label: "Women",        filter: "Women" },
            { label: "Men",          filter: "Men" },
            { label: "Kids",         filter: "Kids" },
            { label: "Accessories",  filter: "Accessories" },
            { label: "New Arrivals", filter: "New Arrivals" },
            { label: "Sale",         filter: "Sale" },
          ].map(({ label, filter }) => (
            <span key={label} className="footer-link" onClick={() => {
              window.dispatchEvent(new CustomEvent("sanjiiiii:shop-filter", { detail: filter }));
              navigate("shop");
            }}>{label}</span>
          ))}
        </div>
        <div>
          <div className="footer-col-title">Help</div>
          <span className="footer-link" onClick={() => navigate("shipping")}>Shipping &amp; Returns</span>
          <span className="footer-link" onClick={() => navigate("faq")}>FAQ</span>
          <span className="footer-link" onClick={() => navigate("contact")}>Contact Us</span>
          <span className="footer-link" onClick={() => navigate("about")}>Stores</span>
          <span className="footer-link" onClick={() => navigate("privacy")}>Privacy Policy</span>
          <span className="footer-link" onClick={() => navigate("terms")}>Terms</span>
          <span className="footer-link" onClick={() => window.dispatchEvent(new Event("velours:cookie-settings"))}>
            Cookie Settings
          </span>
        </div>
        <div>
          <div className="footer-col-title">Company</div>
          <span className="footer-link" onClick={() => navigate("about")}>Our Story</span>
          <span className="footer-link" onClick={() => navigate("about")}>Sustainability</span>
          <span className="footer-link" onClick={() => navigate("about")}>Careers</span>
          <span className="footer-link" onClick={() => navigate("about")}>Press</span>
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
