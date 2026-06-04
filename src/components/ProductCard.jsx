import { isOnSale, saleDiscountPercent, fmt } from "../utils/helpers.js";
import ProductPhoto from "./ProductPhoto.jsx";

// ─── Product Card ─────────────────────────────────────────────────────────────
export default function ProductCard({ product, delay, navigate, addToCart, toggleWishlist, wishlisted, onRequestStock }) {
  const inStock = product.inStock !== false;
  const onSale = isOnSale(product);
  return (
    <div className={`product-card animate-fade-d${Math.min(delay + 1, 4)}`}>
      <button className={`wishlist-btn${wishlisted ? " active" : ""}`} onClick={e => { e.stopPropagation(); toggleWishlist(product.id); }}>
        {wishlisted ? "♥" : "♡"}
      </button>
      <div className="product-img" onClick={() => navigate("product", product)}>
        <div className="product-badge-stack">
          {product.badge && <div className="product-badge">{product.badge}</div>}
          {!inStock && <div className="product-badge product-badge-oos">Out of stock</div>}
        </div>
        <ProductPhoto product={product} className="product-photo" />
        <div className="product-actions-overlay">
          <button
            type="button"
            className="overlay-btn overlay-btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              if (inStock) addToCart(product, product.sizes[0]);
              else onRequestStock?.(product, product);
            }}
          >
            {inStock ? "Add to Bag" : "Request for stock"}
          </button>
          <button type="button" className="overlay-btn overlay-btn-outline" onClick={e => { e.stopPropagation(); navigate("product", product); }}>View</button>
        </div>
      </div>
      <div className="product-info" onClick={() => navigate("product", product)}>
        <div className="product-brand">{product.brand}</div>
        <div className="product-name">{product.name}</div>
        {onSale ? (
          <div className="product-price-row">
            <span className="product-price-was">{fmt(product.compareAt)}</span>
            <span className="product-price">{fmt(product.price)}</span>
            <span className="product-discount-pct">{saleDiscountPercent(product)}% off</span>
          </div>
        ) : (
          <div className="product-price">{fmt(product.price)}</div>
        )}
      </div>
    </div>
  );
}

