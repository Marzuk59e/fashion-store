import Footer from "../components/Footer.jsx";
import { CATEGORY_FALLBACK_IMAGES } from "../data/productImages.js";
import { isOnSale } from "../utils/helpers.js";
import ProductCard from "../components/ProductCard.jsx";


// ─── Home Page ────────────────────────────────────────────────────────────────
export default function HomePage({ navigate, products, addToCart, toggleWishlist, wishlist, onRequestStock }) {
  return (
    <div>
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-pattern" />
        <div className="hero-content">
          <p className="hero-eyebrow">✦ New Collection 2026 ✦</p>
          <h1 className="hero-title">Dress for the<br /><em>Life You Deserve</em></h1>
          <p className="hero-sub">Curated luxury · Sustainable fashion · Timeless elegance</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate("shop")}>Explore Collection</button>
            <button className="btn-outline" onClick={() => navigate("about")}>Our Story</button>
          </div>
        </div>
      </section>

      <div className="marquee-wrapper">
        <div className="marquee-track">
          {[...Array(2)].map((_, i) =>
            ["Free shipping over $200", "Sustainably crafted", "Gift wrapping available", "New arrivals weekly", "Members save 15%"].map((t, j) => (
              <span key={`${i}-${j}`} className="marquee-item">{t} <span style={{ color: "rgba(201,169,110,0.4)" }}>◆</span></span>
            ))
          )}
        </div>
      </div>

      <section style={{ padding: 0 }}>
        <div className="categories-strip">
          {[
            { label: "Women", count: "48 pieces", cls: "cat-women", image: CATEGORY_FALLBACK_IMAGES.Women },
            { label: "Men", count: "36 pieces", cls: "cat-men", image: CATEGORY_FALLBACK_IMAGES.Men },
            { label: "Kids", count: "18 pieces", cls: "cat-children", image: CATEGORY_FALLBACK_IMAGES.Kids },
            { label: "Accessories", count: "24 pieces", cls: "cat-access", image: CATEGORY_FALLBACK_IMAGES.Accessories },
          ].map(cat => (
            <div key={cat.label} className="category-card" onClick={() => navigate("shop")}>
              <div className={`category-bg ${cat.cls}`}>
                <img src={cat.image} alt={cat.label} className="cat-photo" loading="lazy" />
              </div>
              <div className="category-overlay">
                <div className="cat-label">{cat.label}</div>
                <div className="cat-count">{cat.count}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="section-header animate-fade">
          <p className="section-eyebrow">Hand-Picked</p>
          <h2 className="section-title">Editor's <em>Picks</em></h2>
        </div>
        <div className="products-grid">
          {products.filter(p => p.badge).map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i} navigate={navigate} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlisted={wishlist.includes(p.id)} onRequestStock={onRequestStock} />
          ))}
        </div>
      </section>

      <section style={{ background: "var(--charcoal)", padding: "80px 40px", textAlign: "center" }}>
        <p style={{ fontSize: "0.68rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>Members Club</p>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,4vw,3rem)", color: "var(--cream)", fontWeight: 300, marginBottom: 16 }}>Join for <em>Exclusive</em> Benefits</h2>
        <p style={{ fontSize: "0.8rem", color: "rgba(250,247,242,0.55)", maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.8 }}>
          Free express shipping · Early access · Members-only sales · Personal styling
        </p>
        <button className="btn-primary" onClick={() => navigate("shop")}>Shop the Collection</button>
      </section>

      <section className="section">
        <div className="section-header animate-fade">
          <p className="section-eyebrow">Just In</p>
          <h2 className="section-title">New <em>Arrivals</em></h2>
        </div>
        <div className="products-grid">
          {products.slice(6, 10).map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i} navigate={navigate} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlisted={wishlist.includes(p.id)} onRequestStock={onRequestStock} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <button className="btn-primary" onClick={() => navigate("shop")}>View All Pieces</button>
        </div>
      </section>

      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="section-header animate-fade">
          <p className="section-eyebrow">Best Value</p>
          <h2 className="section-title"><em>Sales</em></h2>
        </div>
        <div className="products-grid">
          {products.filter(isOnSale).slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i} navigate={navigate} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlisted={wishlist.includes(p.id)} onRequestStock={onRequestStock} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <button className="btn-primary" onClick={() => navigate("shop")}>Shop the Sale</button>
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}

