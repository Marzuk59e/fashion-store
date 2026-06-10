import { useState } from "react";
import ProductPhoto from "../components/ProductPhoto.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { isOnSale, saleDiscountPercent, fmt } from "../utils/helpers.js";

// ─── Accordion ────────────────────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "16px 0", background: "none",
          border: "none", cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--charcoal)", fontWeight: 600 }}>
          {title}
        </span>
        <span style={{
          fontSize: "1.1rem", color: "var(--warm-gray)", lineHeight: 1,
          transition: "transform 0.25s", display: "block",
          transform: open ? "rotate(45deg)" : "rotate(0)",
        }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 22, fontSize: "0.76rem", color: "var(--warm-gray)", lineHeight: 1.85 }}>
          {children}
        </div>
      )}
    </div>
  );
}

const CRUMB_BTN = {
  background: "none", border: "none", cursor: "pointer",
  fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase",
  color: "var(--warm-gray)", padding: 0,
};

// ─── Product Detail ───────────────────────────────────────────────────────────
export default function ProductDetailPage({
  product, navigate, addToCart, toggleWishlist, wishlist, onRequestStock,
  products = [],
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] ?? "Free Size");
  const wishlisted = wishlist.includes(product.id);
  const inStock = product.inStock !== false;
  const onSale = isOnSale(product);

  // Related products — same category first, then fallback
  const sameCategory = products.filter(p => p.id !== product.id && p.category === product.category);
  const suggestions = (sameCategory.length >= 2 ? sameCategory : products.filter(p => p.id !== product.id)).slice(0, 4);

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>

      {/* ── Breadcrumb ── */}
      <div style={{
        padding: "14px clamp(20px, 5vw, 48px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10,
        background: "var(--cream)",
      }}>
        <button type="button" style={CRUMB_BTN} onClick={() => navigate("home")}>Home</button>
        <span style={{ color: "var(--border)", fontSize: "0.75rem" }}>›</span>
        <button type="button" style={CRUMB_BTN} onClick={() => navigate("shop")}>Collection</button>
        <span style={{ color: "var(--border)", fontSize: "0.75rem" }}>›</span>
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--charcoal)" }}>{product.name}</span>
      </div>

      {/* ── Main Grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        maxWidth: 1160,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 56px) clamp(20px, 5vw, 48px)",
        gap: "clamp(32px, 5vw, 72px)",
        alignItems: "start",
      }}>

        {/* ── Left: Image ── */}
        <div style={{ position: "sticky", top: 80 }}>
          <div style={{ position: "relative", background: "var(--surface)", aspectRatio: "3/4", overflow: "hidden" }}>
            <div className="product-badge-stack">
              {product.badge && <div className="product-badge">{product.badge}</div>}
              {!inStock && <div className="product-badge product-badge-oos">Out of Stock</div>}
            </div>
            <ProductPhoto product={product} />
          </div>
        </div>

        {/* ── Right: Info ── */}
        <div>
          {/* Brand */}
          <p style={{ fontSize: "0.6rem", letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>
            {product.brand}
          </p>

          {/* Name */}
          <h1 style={{
            fontFamily: "var(--font-serif)", fontSize: "clamp(1.7rem, 3vw, 2.6rem)",
            fontWeight: 300, lineHeight: 1.15, color: "var(--charcoal)", marginBottom: 20,
          }}>
            {product.name}
          </h1>

          {/* Price */}
          {onSale ? (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px 14px", marginBottom: 24 }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.45rem", color: "var(--charcoal)" }}>{fmt(product.price)}</span>
              <span style={{ textDecoration: "line-through", color: "var(--warm-gray)", fontSize: "0.95rem" }}>{fmt(product.compareAt)}</span>
              <span style={{
                fontSize: "0.6rem", letterSpacing: "0.12em",
                background: "var(--charcoal)", color: "var(--cream)",
                padding: "3px 9px", textTransform: "uppercase",
              }}>{saleDiscountPercent(product)}% off</span>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.45rem", color: "var(--charcoal)", marginBottom: 24 }}>
              {fmt(product.price)}
            </p>
          )}

          {/* Description */}
          <p style={{ fontSize: "0.8rem", color: "var(--warm-gray)", lineHeight: 1.85, marginBottom: 28, maxWidth: 420 }}>
            {product.desc}
          </p>

          {/* Size */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: "0.62rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--charcoal)" }}>
                Size
              </span>
              <button type="button" style={{ ...CRUMB_BTN, textDecoration: "underline", textUnderlineOffset: 3 }}>
                Size Guide ↗
              </button>
            </div>
            <div className="size-grid">
              {(product.sizes ?? ["Free Size"]).map(s => (
                <button key={s} className={`size-btn${selectedSize === s ? " selected" : ""}`} onClick={() => setSelectedSize(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              className="add-cart-btn"
              style={{ flex: 1 }}
              onClick={() => inStock ? addToCart(product, selectedSize) : onRequestStock?.(product, product)}
            >
              {inStock ? "Add to Bag" : "Request Restock"}
            </button>
            <button
              type="button"
              className={`wish-btn${wishlisted ? " active" : ""}`}
              onClick={() => toggleWishlist(product.id)}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              {wishlisted ? "♥" : "♡"}
            </button>
          </div>

          {!inStock && (
            <p style={{ fontSize: "0.7rem", color: "var(--warm-gray)", marginBottom: 20, lineHeight: 1.7 }}>
              This piece is currently unavailable. Request a restock and we'll notify you as soon as it arrives.
            </p>
          )}

          {/* ── Accordions ── */}
          <div style={{ marginTop: 8 }}>

            <Accordion title="Product Details" defaultOpen>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Material",       "Premium sustainable fabric blend"],
                  ["Fit",            "True to size · Regular fit"],
                  ["Origin",         "Ethically crafted in Italy"],
                  ["Care",           "Dry clean recommended · Do not tumble dry"],
                  ["Sustainability", "Made with responsibly sourced materials"],
                  ["Packaging",      "Ships in recycled, plastic-free packaging"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 14 }}>
                    <span style={{ minWidth: 100, fontWeight: 600, color: "var(--charcoal)", fontSize: "0.72rem", flexShrink: 0 }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </Accordion>

            <Accordion title="Delivery & Returns">
              <div style={{ display: "grid", gap: 14 }}>
                {[
                  ["🚚 Standard",  "3–5 business days · Free on orders over $200"],
                  ["⚡ Express",    "1–2 business days · $15"],
                  ["↩ Returns",    "Free returns within 30 days · Unworn, tags attached"],
                  ["🔄 Exchanges", "Contact us within 7 days of receiving your order"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontWeight: 600, color: "var(--charcoal)", fontSize: "0.72rem", marginBottom: 3 }}>{k}</div>
                    <div>{v}</div>
                  </div>
                ))}
              </div>
            </Accordion>

            <Accordion title="Size Guide">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.7rem", minWidth: 320 }}>
                  <thead>
                    <tr>
                      {["Size", "UK", "EU", "US", "Chest", "Waist"].map(h => (
                        <th key={h} style={{
                          padding: "7px 10px", background: "var(--charcoal)", color: "var(--cream)",
                          fontWeight: 600, textAlign: "left", letterSpacing: "0.1em", fontFamily: "inherit",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["XS", "6",  "34", "2",  "32\"", "24\""],
                      ["S",  "8",  "36", "4",  "34\"", "26\""],
                      ["M",  "10", "38", "6",  "36\"", "28\""],
                      ["L",  "12", "40", "8",  "38\"", "30\""],
                      ["XL", "14", "42", "10", "40\"", "32\""],
                    ].map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--surface)" }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: "7px 10px", color: "var(--charcoal)" }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Accordion>

            <div style={{ borderTop: "1px solid var(--border)" }} />
          </div>

          {/* ── Trust Badges ── */}
          <div style={{ marginTop: 24, display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              ["🔒", "Secure Checkout"],
              ["✦",  "Authenticity Guaranteed"],
              ["🌿", "Sustainable Sourcing"],
            ].map(([icon, label]) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 7,
                fontSize: "0.6rem", color: "var(--warm-gray)",
                letterSpacing: "0.12em", textTransform: "uppercase",
              }}>
                <span style={{ fontSize: "0.9rem" }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── You May Also Like ── */}
      {suggestions.length > 0 && (
        <section style={{
          padding: "clamp(40px, 6vw, 72px) clamp(20px, 5vw, 48px)",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: "0.6rem", letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>
              Complete Your Look
            </p>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 300, color: "var(--charcoal)" }}>
              You May Also <em>Like</em>
            </h2>
          </div>
          <div className="products-grid" style={{ maxWidth: 1160, margin: "0 auto" }}>
            {suggestions.map((p, i) => (
              <ProductCard
                key={p.id} product={p} delay={i}
                navigate={navigate} addToCart={addToCart}
                toggleWishlist={toggleWishlist}
                wishlisted={wishlist.includes(p.id)}
                onRequestStock={onRequestStock}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
