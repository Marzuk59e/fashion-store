import Footer from "../components/Footer.jsx";
import ProductPhoto from "../components/ProductPhoto.jsx";
import { useState, useEffect, useMemo, useRef } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { fmt, productMatchesSearch } from "../utils/helpers.js";

// ─── Shop Page ────────────────────────────────────────────────────────────────
export default function ShopPage({ products, navigate, filter, setFilter, sort, setSort, addToCart, toggleWishlist, wishlist, searchOpen, onCloseSearch, searchQuery, setSearchQuery, onRequestStock }) {
  const searchInputRef = useRef(null);
  useEffect(() => {
    if (searchOpen) {
      const id = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [searchOpen]);

  const { displayed, suggestions } = useMemo(() => {
    let base = filter === "All" ? products : products.filter(p => p.category === filter);
    if (sort === "price-asc") base = [...base].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") base = [...base].sort((a, b) => b.price - a.price);
    if (sort === "new") base = [...base].filter(p => p.badge === "New").concat(base.filter(p => p.badge !== "New"));

    const q = searchQuery.trim();
    const displayed = q ? base.filter(p => productMatchesSearch(p, searchQuery)) : base;
    const suggestions = q ? products.filter(p => productMatchesSearch(p, searchQuery)).slice(0, 6) : [];
    return { displayed, suggestions };
  }, [products, filter, sort, searchQuery]);

  return (
    <div className="shop-layout">
      <div className="shop-header animate-fade">
        <div>
          <h1 className="shop-title">The Collection</h1>
          <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginTop: 4 }}>{displayed.length} pieces</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div className="filter-bar">
            {["All", "Women", "Men", "Kids", "Accessories"].map(c => (
              <button type="button" key={c} className={`filter-btn${filter === c ? " active" : ""}`} onClick={() => setFilter(c)}>{c}</button>
            ))}
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="new">New Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>
      {searchOpen && (
        <div className="shop-search-wrap animate-fade">
          <div className="shop-search-inner">
            <svg width="18" height="18" fill="none" stroke="var(--gold)" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /></svg>
            <input
              ref={searchInputRef}
              className="shop-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by product name or brand…"
              aria-autocomplete="list"
              aria-expanded={Boolean(searchQuery.trim())}
              autoComplete="off"
            />
            <button type="button" className="shop-search-close" onClick={onCloseSearch} aria-label="Close search">✕</button>
          </div>
          {searchQuery.trim() && (
            <div className="shop-search-dropdown" role="listbox">
              {suggestions.length === 0 ? (
                <div className="shop-search-empty">No matches for that search.</div>
              ) : (
                suggestions.map(p => (
                  <div
                    key={p.id}
                    role="option"
                    className="shop-search-suggestion"
                    onClick={() => navigate("product", p)}
                  >
                    <div className="shop-search-sug-thumb">
                      <ProductPhoto product={p} />
                    </div>
                    <div className="shop-search-sug-text">
                      <div className="shop-search-sug-name">{p.name}</div>
                      <div className="shop-search-sug-meta">{p.brand} · {p.category}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {p.inStock === false && <div className="shop-search-sug-badge">Request for stock</div>}
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gold)", marginTop: p.inStock === false ? 4 : 0 }}>{fmt(p.price)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
      <div className="products-grid">
        {displayed.map((p, i) => (
          <ProductCard key={p.id} product={p} delay={i % 4} navigate={navigate} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlisted={wishlist.includes(p.id)} onRequestStock={onRequestStock} />
        ))}
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

