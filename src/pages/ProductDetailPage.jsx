import Footer from "../components/Footer.jsx";
import { useState } from "react";
import ProductPhoto from "../components/ProductPhoto.jsx";
import { isOnSale, saleDiscountPercent, fmt } from "../utils/helpers.js";

// ─── Product Detail ───────────────────────────────────────────────────────────
export default function ProductDetailPage({ product, navigate, addToCart, toggleWishlist, wishlist, onRequestStock }) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const wishlisted = wishlist.includes(product.id);
  const inStock = product.inStock !== false;
  const onSale = isOnSale(product);
  return (
    <div>
      <div className="product-detail">
        <div className="animate-scale">
          <div className="detail-img">
            <div className="product-badge-stack">
              {product.badge && <div className="product-badge">{product.badge}</div>}
              {!inStock && <div className="product-badge product-badge-oos">Out of stock</div>}
            </div>
            <ProductPhoto product={product} />
          </div>
        </div>
        <div className="animate-fade">
          <button type="button" onClick={() => navigate("shop")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--warm-gray)", marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
            ← Back to Collection
          </button>
          <div className="detail-brand">{product.brand}</div>
          <h1 className="detail-name">{product.name}</h1>
          {onSale ? (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "10px 14px" }}>
                <span style={{ textDecoration: "line-through", color: "var(--warm-gray)", fontSize: "1.05rem" }}>{fmt(product.compareAt)}</span>
                <div className="detail-price" style={{ marginBottom: 0 }}>{fmt(product.price)}</div>
                <span className="product-discount-pct">{saleDiscountPercent(product)}% off</span>
              </div>
            </div>
          ) : (
            <div className="detail-price">{fmt(product.price)}</div>
          )}
          <p className="detail-desc">{product.desc}</p>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--warm-gray)", marginBottom: 10 }}>Select Size</p>
          <div className="size-grid">
            {product.sizes.map(s => (
              <button key={s} className={`size-btn${selectedSize === s ? " selected" : ""}`} onClick={() => setSelectedSize(s)}>{s}</button>
            ))}
          </div>
          <div className="detail-actions">
            <button
              type="button"
              className="add-cart-btn"
              onClick={() => {
                if (inStock) addToCart(product, selectedSize);
                else onRequestStock?.(product, product);
              }}
            >
              {inStock ? "Add to Bag" : "Request for stock"}
            </button>
            <button type="button" className={`wish-btn${wishlisted ? " active" : ""}`} onClick={() => toggleWishlist(product.id)}>{wishlisted ? "♥" : "♡"}</button>
          </div>
          {!inStock && <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginTop: 12 }}>This piece is currently unavailable. Tap “Request for stock” and we will prioritize a restock note for you, or save it to your wishlist.</p>}
          <div style={{ marginTop: 28, paddingTop: 28, borderTop: "1px solid var(--border)" }}>
            {[["🚚", "Free Express Delivery", "On orders over $200"], ["↩️", "Easy Returns", "30-day free returns"], ["✦", "Authenticity Guaranteed", "100% genuine products"]].map(([icon, title, sub]) => (
              <div key={title} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "center" }}>
                <span style={{ fontSize: "1.2rem" }}>{icon}</span>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--warm-gray)" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

