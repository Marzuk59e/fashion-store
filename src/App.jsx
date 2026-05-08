import { useState, useEffect } from "react";

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

// ─── CSS ─────────────────────────────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #FAF7F2;
    --charcoal: #1A1A1A;
    --gold: #C9A96E;
    --gold-light: #E8D5B0;
    --warm-gray: #6F685F;
    --border: #E8E2D9;
    --white: #FFFFFF;
    --error: #C0392B;
    --success: #27AE60;
    --font-serif: 'Cormorant Garamond', Georgia, serif;
    --font-sans: 'Montserrat', sans-serif;
  }
  body { background: var(--cream); color: var(--charcoal); font-family: var(--font-sans); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--cream); }
  ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 3px; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @keyframes fadeInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes toastIn { from { opacity:0; transform: translateX(40px); } to { opacity:1; transform: translateX(0); } }
  @keyframes toastOut { from { opacity:1; } to { opacity:0; } }

  .animate-fade { animation: fadeIn 0.6s ease both; }
  .animate-fade-d1 { animation: fadeIn 0.6s 0.1s ease both; }
  .animate-fade-d2 { animation: fadeIn 0.6s 0.2s ease both; }
  .animate-fade-d3 { animation: fadeIn 0.6s 0.3s ease both; }
  .animate-fade-d4 { animation: fadeIn 0.6s 0.4s ease both; }
  .animate-scale { animation: scaleIn 0.5s ease both; }

  .navbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    background: rgba(250,247,242,0.96); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 40px; height: 64px; transition: box-shadow 0.3s;
  }
  .navbar.scrolled { box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .nav-logo { font-family: var(--font-serif); font-size: 1.7rem; font-weight: 600; letter-spacing: 0.12em; color: var(--charcoal); cursor: pointer; text-transform: uppercase; background: none; border: none; }
  .nav-logo span { color: var(--gold); }
  .nav-links { display: flex; gap: 32px; align-items: center; }
  .nav-link { font-size: 0.72rem; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--warm-gray); cursor: pointer; transition: color 0.2s; border: none; background: none; }
  .nav-link:hover, .nav-link.active { color: var(--charcoal); }
  .nav-icons { display: flex; gap: 20px; align-items: center; }
  .icon-btn { background: none; border: none; cursor: pointer; position: relative; color: var(--charcoal); padding: 4px; transition: color 0.2s; display: flex; align-items: center; }
  .icon-btn:hover { color: var(--gold); }
  .badge { position: absolute; top: -4px; right: -6px; background: var(--gold); color: white; border-radius: 50%; width: 16px; height: 16px; font-size: 0.6rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }

  .hero { height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background: var(--charcoal); }
  .hero-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #1A1A1A 0%, #2C2416 40%, #1A1A1A 100%); }
  .hero-pattern { position: absolute; inset: 0; opacity: 0.04; background-image: repeating-linear-gradient(45deg, var(--gold) 0, var(--gold) 1px, transparent 0, transparent 50%); background-size: 20px 20px; }
  .hero-content { position: relative; z-index: 2; text-align: center; padding: 20px; max-width: 800px; }
  .hero-eyebrow { font-family: var(--font-sans); font-size: 0.7rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 24px; animation: fadeIn 0.8s ease both; }
  .hero-title { font-family: var(--font-serif); font-size: clamp(3rem, 8vw, 6.5rem); font-weight: 300; line-height: 1.05; color: var(--cream); margin-bottom: 28px; animation: fadeIn 0.8s 0.2s ease both; }
  .hero-title em { font-style: italic; color: var(--gold-light); }
  .hero-sub { font-size: 0.8rem; letter-spacing: 0.12em; color: rgba(250,247,242,0.55); margin-bottom: 48px; animation: fadeIn 0.8s 0.4s ease both; text-transform: uppercase; }
  .hero-actions { display: flex; gap: 16px; justify-content: center; animation: fadeIn 0.8s 0.6s ease both; flex-wrap: wrap; }

  .btn-primary { background: var(--gold); color: white; border: none; cursor: pointer; padding: 14px 36px; font-family: var(--font-sans); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; transition: all 0.3s; }
  .btn-primary:hover { background: #B8915A; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(201,169,110,0.35); }
  .btn-outline { background: transparent; color: var(--cream); border: 1px solid rgba(250,247,242,0.35); cursor: pointer; padding: 14px 36px; font-family: var(--font-sans); font-size: 0.72rem; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; transition: all 0.3s; }
  .btn-outline:hover { border-color: var(--gold); color: var(--gold); }

  .section { padding: 80px 40px; }
  .section-header { text-align: center; margin-bottom: 56px; }
  .section-eyebrow { font-size: 0.68rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
  .section-title { font-family: var(--font-serif); font-size: clamp(2rem, 4vw, 3rem); font-weight: 400; color: var(--charcoal); line-height: 1.2; }
  .section-title em { font-style: italic; }

  .categories-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; }
  .category-card { position: relative; overflow: hidden; cursor: pointer; aspect-ratio: 3/4; }
  .category-bg { width: 100%; height: 100%; transition: transform 0.6s ease; display: flex; align-items: center; justify-content: center; }
  .category-card:hover .category-bg { transform: scale(1.04); }
  .cat-women { background: linear-gradient(160deg, #E8EDF4 0%, #D7DFEA 100%); }
  .cat-men { background: linear-gradient(160deg, #DEE8F6 0%, #C9D8EC 100%); }
  .cat-access { background: linear-gradient(160deg, #F2E5D9 0%, #E8D4C2 100%); }
  .cat-children { background: linear-gradient(160deg, #E9F2EC 0%, #D3E6DA 100%); }
  .cat-icon { font-size: 5rem; opacity: 0.34; position: absolute; color: rgba(24,24,24,0.35); }
  .category-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,12,16,0.5) 0%, rgba(10,12,16,0.1) 58%, rgba(10,12,16,0) 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 32px; transition: background 0.3s; }
  .category-card:hover .category-overlay { background: linear-gradient(to top, rgba(10,12,16,0.58) 0%, rgba(10,12,16,0.16) 58%, rgba(10,12,16,0) 100%); }
  .cat-label { font-family: var(--font-serif); font-size: 1.6rem; font-weight: 400; color: white; margin-bottom: 4px; }
  .cat-count { font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold-light); }

  .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 32px; max-width: 1200px; margin: 0 auto; }
  .product-card { background: white; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; }
  .product-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); }
  .product-img { aspect-ratio: 3/4; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
  .product-img .product-emoji { font-size: 5rem; opacity: 0.5; transition: transform 0.4s; position: relative; z-index: 1; }
  .product-card:hover .product-emoji { transform: scale(1.12); }
  .product-img-gradient { position: absolute; inset: 0; }
  .product-actions-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(26,26,26,0.9); padding: 12px 16px; transform: translateY(100%); transition: transform 0.3s ease; display: flex; gap: 8px; z-index: 2; }
  .product-card:hover .product-actions-overlay { transform: translateY(0); }
  .overlay-btn { flex: 1; padding: 8px; border: none; cursor: pointer; font-family: var(--font-sans); font-size: 0.65rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; transition: all 0.2s; }
  .overlay-btn-primary { background: var(--gold); color: white; }
  .overlay-btn-primary:hover { background: #B8915A; }
  .overlay-btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; }
  .overlay-btn-outline:hover { border-color: var(--gold); color: var(--gold); }
  .product-info { padding: 16px; }
  .product-brand { font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-gray); margin-bottom: 4px; }
  .product-name { font-family: var(--font-serif); font-size: 1.05rem; color: var(--charcoal); margin-bottom: 8px; }
  .product-price { font-size: 0.85rem; font-weight: 600; color: var(--gold); }
  .product-badge { position: absolute; top: 12px; left: 12px; z-index: 2; background: var(--charcoal); color: white; font-size: 0.58rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; }
  .wishlist-btn { position: absolute; top: 12px; right: 12px; z-index: 2; background: white; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; color: var(--charcoal); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.12); transition: all 0.2s; }
  .wishlist-btn:hover { transform: scale(1.12); }
  .wishlist-btn.active { background: var(--gold); color: white; }

  .overlay-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1100; animation: fadeIn 0.25s ease; backdrop-filter: blur(3px); }
  .modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 1200; background: white; width: 90%; max-width: 480px; animation: scaleIn 0.3s ease; max-height: 90vh; overflow-y: auto; }
  .modal-header { padding: 28px 32px 0; display: flex; justify-content: space-between; align-items: center; }
  .modal-title { font-family: var(--font-serif); font-size: 1.6rem; font-weight: 400; }
  .close-btn { background: none; border: none; font-size: 1.4rem; cursor: pointer; color: var(--warm-gray); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
  .close-btn:hover { color: var(--charcoal); }
  .modal-body { padding: 24px 32px 32px; }

  .cart-drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 420px; max-width: 100vw; background: var(--cream); z-index: 1200; overflow-y: auto; border-left: 1px solid var(--border); animation: fadeInRight 0.3s ease; }
  .cart-header { padding: 24px 28px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: var(--cream); z-index: 1; }
  .cart-title { font-family: var(--font-serif); font-size: 1.5rem; }
  .cart-items { padding: 20px 28px; }
  .cart-item { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--border); animation: fadeIn 0.3s ease; }
  .cart-item-img { width: 72px; height: 90px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 2rem; }
  .cart-item-info { flex: 1; }
  .cart-item-name { font-family: var(--font-serif); font-size: 0.95rem; margin-bottom: 4px; }
  .cart-item-meta { font-size: 0.7rem; color: var(--warm-gray); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.1em; }
  .cart-item-price { font-size: 0.8rem; font-weight: 600; color: var(--gold); }
  .qty-control { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
  .qty-btn { width: 24px; height: 24px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: var(--charcoal); }
  .qty-btn:hover { background: var(--charcoal); color: white; border-color: var(--charcoal); }
  .qty-num { font-size: 0.8rem; font-weight: 600; min-width: 20px; text-align: center; }
  .remove-btn { background: none; border: none; color: var(--warm-gray); cursor: pointer; font-size: 0.7rem; margin-left: auto; transition: color 0.2s; }
  .remove-btn:hover { color: var(--error); }
  .cart-footer { padding: 20px 28px; border-top: 1px solid var(--border); position: sticky; bottom: 0; background: var(--cream); }
  .cart-total { display: flex; justify-content: space-between; margin-bottom: 16px; align-items: baseline; }
  .cart-total-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--warm-gray); }
  .cart-total-price { font-family: var(--font-serif); font-size: 1.4rem; color: var(--charcoal); }
  .checkout-btn { width: 100%; padding: 16px; background: var(--charcoal); color: white; border: none; cursor: pointer; font-family: var(--font-sans); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; transition: all 0.3s; }
  .checkout-btn:hover { background: var(--gold); }
  .empty-cart { text-align: center; padding: 60px 20px; color: var(--warm-gray); }
  .empty-cart .empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.4; }
  .empty-cart p { font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; }

  .form-group { margin-bottom: 20px; }
  .form-row-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-label { display: block; text-align: left; font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-gray); margin-bottom: 8px; }
  .form-input { width: 100%; padding: 12px 14px; border: 1px solid var(--border); background: var(--cream); font-family: var(--font-sans); font-size: 0.85rem; color: var(--charcoal); transition: border-color 0.2s; outline: none; }
  .form-input:focus { border-color: var(--gold); }
  .form-input.invalid { border-color: var(--error); background: #FFF4F2; }
  .phone-wrap { display: flex; align-items: center; border: 1px solid var(--border); background: var(--cream); }
  .phone-code { padding: 0 12px; font-size: 0.78rem; color: var(--warm-gray); border-right: 1px solid var(--border); min-height: 42px; display: flex; align-items: center; }
  .phone-wrap .form-input { border: none; background: transparent; }
  .form-error { font-size: 0.7rem; color: var(--error); margin-top: 4px; }
  .auth-switch { text-align: center; margin-top: 20px; font-size: 0.75rem; color: var(--warm-gray); }
  .auth-switch button { background: none; border: none; color: var(--gold); cursor: pointer; font-weight: 600; text-decoration: underline; }
  .form-submit { width: 100%; padding: 14px; background: var(--charcoal); color: white; border: none; cursor: pointer; font-family: var(--font-sans); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; transition: background 0.3s; margin-top: 8px; }
  .form-submit:hover { background: var(--gold); }
  .auth-divider { display: flex; align-items: center; text-align: center; margin: 24px 0; color: var(--warm-gray); font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; }
  .auth-divider::before, .auth-divider::after { content: ''; flex: 1; border-bottom: 1px solid var(--border); }
  .auth-divider:not(:empty)::before { margin-right: 1.5em; }
  .auth-divider:not(:empty)::after { margin-left: 1.5em; }
  .social-login-grid { display: grid; gap: 12px; }
  .btn-social { width: 100%; padding: 12px; border: 1px solid var(--border); background: white; color: var(--charcoal); cursor: pointer; font-family: var(--font-sans); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.1em; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; }
  .btn-social:hover { background: var(--cream); border-color: var(--gold); }
  .social-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }

  .profile-layout { max-width: 1100px; margin: 0 auto; padding: 100px 40px 60px; }
  .profile-header { display: flex; gap: 28px; align-items: center; margin-bottom: 48px; padding-bottom: 40px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .avatar { width: 80px; height: 80px; background: var(--charcoal); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-serif); font-size: 2rem; color: var(--gold-light); flex-shrink: 0; }
  .profile-name { font-family: var(--font-serif); font-size: 1.8rem; font-weight: 400; margin-bottom: 4px; }
  .profile-email { font-size: 0.75rem; color: var(--warm-gray); letter-spacing: 0.05em; }
  .profile-tabs { display: flex; gap: 0; margin-bottom: 40px; border-bottom: 1px solid var(--border); overflow-x: auto; }
  .profile-tab { padding: 12px 24px; background: none; border: none; cursor: pointer; font-family: var(--font-sans); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--warm-gray); border-bottom: 2px solid transparent; transition: all 0.2s; margin-bottom: -1px; white-space: nowrap; }
  .profile-tab.active { color: var(--charcoal); border-bottom-color: var(--gold); }

  .shop-layout { padding: 88px 40px 60px; max-width: 1300px; margin: 0 auto; }
  .shop-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px; }
  .shop-title { font-family: var(--font-serif); font-size: 2.2rem; font-weight: 400; }
  .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; }
  .filter-btn { padding: 7px 18px; border: 1px solid var(--border); background: none; font-family: var(--font-sans); font-size: 0.65rem; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; color: var(--warm-gray); }
  .filter-btn:hover, .filter-btn.active { background: var(--charcoal); color: white; border-color: var(--charcoal); }
  .sort-select { padding: 8px 14px; border: 1px solid var(--border); background: none; font-family: var(--font-sans); font-size: 0.68rem; color: var(--charcoal); cursor: pointer; outline: none; }

  .toast-container { position: fixed; bottom: 28px; right: 28px; z-index: 2000; display: flex; flex-direction: column; gap: 10px; }
  .toast { background: var(--charcoal); color: white; padding: 14px 20px; font-size: 0.75rem; letter-spacing: 0.05em; min-width: 240px; display: flex; align-items: center; gap: 10px; animation: toastIn 0.3s ease; border-left: 3px solid var(--gold); }
  .toast.success { border-left-color: var(--success); }
  .toast.removing { animation: toastOut 0.3s ease forwards; }

  .cookie-backdrop { position: fixed; inset: 0; background: rgba(10,12,16,0.22); backdrop-filter: blur(3px); z-index: 2100; animation: fadeIn 0.25s ease both; }

  /* Cookie bar (full-width + slide-up) */
  .cookie-panel {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 2101;
    margin: 0;
    max-width: none;
    background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(250,247,242,0.90));
    border-top: 1px solid rgba(232,226,217,0.95);
    box-shadow: 0 -18px 60px rgba(0,0,0,0.18);
    border-radius: 18px 18px 0 0;
    overflow: hidden;
    animation: cookieUp 520ms cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes cookieUp {
    from { transform: translateY(120%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cookie-panel { animation: none; }
  }
  .cookie-top { display: flex; gap: 14px; padding: 14px 18px 12px; align-items: center; max-width: 1120px; margin: 0 auto; }
  .cookie-badge {
    flex: 0 0 auto;
    width: 38px; height: 38px;
    border-radius: 12px;
    background: #B07A5A;
    display: grid; place-items: center;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.10), 0 10px 26px rgba(0,0,0,0.10);
  }
  .cookie-badge svg { width: 28px; height: 28px; }
  .cookie-title { font-family: var(--font-serif); font-size: 1.05rem; letter-spacing: 0.02em; margin-bottom: 2px; color: var(--charcoal); }
  .cookie-text { font-size: 0.72rem; color: var(--warm-gray); line-height: 1.6; }
  .cookie-text a { color: var(--charcoal); text-decoration: underline; cursor: pointer; }
  .cookie-actions { display: flex; gap: 8px; padding: 0 18px 14px; flex-wrap: wrap; align-items: center; justify-content: flex-end; max-width: 1120px; margin: 0 auto; }
  .cookie-btn {
    border: 1px solid var(--border);
    background: white;
    color: var(--charcoal);
    padding: 9px 10px;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cookie-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(0,0,0,0.10); }
  .cookie-btn.primary { background: var(--gold); color: white; border-color: var(--gold); }
  .cookie-btn.primary:hover { background: #B8915A; border-color: #B8915A; }
  .cookie-btn.dark { background: var(--charcoal); color: white; border-color: var(--charcoal); }
  .cookie-btn.dark:hover { background: #111; border-color: #111; }
  .cookie-btn.ghost { background: transparent; }
  .cookie-drawer {
    border-top: 1px solid rgba(232,226,217,0.9);
    padding: 12px 18px 14px;
    background: rgba(250,247,242,0.55);
    display: grid;
    gap: 10px;
  }
  .cookie-close {
    margin-left: auto;
    width: 34px; height: 34px;
    border-radius: 12px;
    border: 1px solid rgba(26,26,26,0.10);
    background: rgba(255,255,255,0.70);
    cursor: pointer;
    display: grid; place-items: center;
    color: rgba(26,26,26,0.65);
    transition: all 0.2s;
  }
  .cookie-close:hover { background: white; color: var(--charcoal); transform: translateY(-1px); }
  .cookie-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
  .cookie-row strong { font-size: 0.72rem; letter-spacing: 0.02em; }
  .cookie-row span { font-size: 0.7rem; color: var(--warm-gray); }
  .cookie-toggle { display: inline-flex; gap: 10px; align-items: center; }
  .cookie-switch {
    width: 44px; height: 26px; border-radius: 999px;
    border: 1px solid rgba(26,26,26,0.18);
    background: rgba(26,26,26,0.08);
    position: relative; cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }
  .cookie-switch::after {
    content: "";
    position: absolute; top: 50%; left: 4px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: white;
    transform: translateY(-50%);
    box-shadow: 0 6px 16px rgba(0,0,0,0.18);
    transition: left 0.2s;
  }
  .cookie-switch.on { background: rgba(201,169,110,0.35); border-color: rgba(201,169,110,0.65); }
  .cookie-switch.on::after { left: 22px; }
  .cookie-lock { font-size: 0.65rem; color: rgba(26,26,26,0.55); letter-spacing: 0.12em; text-transform: uppercase; }

  .legal-page { padding: 100px 40px 60px; max-width: 1100px; margin: 0 auto; }
  .legal-card { background: white; border: 1px solid var(--border); padding: 28px; }
  .legal-kicker { font-size: 0.7rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
  .legal-h1 { font-family: var(--font-serif); font-size: 2.2rem; font-weight: 400; margin-bottom: 10px; }
  .legal-p { font-size: 0.8rem; color: var(--warm-gray); line-height: 1.9; margin-bottom: 14px; }
  .legal-li { font-size: 0.8rem; color: var(--charcoal); line-height: 1.85; margin: 6px 0; }
  .legal-note { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.72rem; color: var(--warm-gray); line-height: 1.7; }

  .marquee-wrapper { background: var(--charcoal); overflow: hidden; padding: 10px 0; }
  .marquee-track { display: flex; animation: marquee 22s linear infinite; white-space: nowrap; width: max-content; }
  .marquee-item { font-size: 0.62rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); padding: 0 32px; }

  .footer { background: var(--charcoal); color: var(--cream); padding: 60px 40px 28px; }
  .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
  .footer-brand { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
  .footer-brand span { color: var(--gold); }
  .footer-desc { font-size: 0.78rem; color: rgba(250,247,242,0.5); line-height: 1.7; }
  .footer-col-title { font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 16px; }
  .footer-link { display: block; font-size: 0.75rem; color: rgba(250,247,242,0.55); margin-bottom: 8px; cursor: pointer; transition: color 0.2s; }
  .footer-link:hover { color: var(--cream); }
  .footer-bottom { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .footer-copy { font-size: 0.65rem; color: rgba(250,247,242,0.3); letter-spacing: 0.1em; }
  .footer-socials { display: flex; gap: 16px; }
  .social-btn { width: 32px; height: 32px; border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 0.8rem; color: rgba(250,247,242,0.5); }
  .social-btn:hover { border-color: var(--gold); color: var(--gold); }

  .spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }

  .product-detail { max-width: 1100px; margin: 0 auto; padding: 100px 40px 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
  .detail-img { aspect-ratio: 3/4; display: flex; align-items: center; justify-content: center; font-size: 9rem; }
  .detail-brand { font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .detail-name { font-family: var(--font-serif); font-size: 2.4rem; font-weight: 400; margin-bottom: 16px; line-height: 1.2; }
  .detail-price { font-size: 1.4rem; font-weight: 600; color: var(--charcoal); margin-bottom: 28px; }
  .detail-desc { font-size: 0.82rem; color: var(--warm-gray); line-height: 1.8; margin-bottom: 32px; }
  .size-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
  .size-btn { padding: 8px 14px; border: 1px solid var(--border); background: none; cursor: pointer; font-family: var(--font-sans); font-size: 0.72rem; transition: all 0.2s; color: var(--charcoal); }
  .size-btn:hover, .size-btn.selected { background: var(--charcoal); color: white; border-color: var(--charcoal); }
  .detail-actions { display: flex; gap: 12px; }
  .add-cart-btn { flex: 1; padding: 16px; background: var(--charcoal); color: white; border: none; cursor: pointer; font-family: var(--font-sans); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; transition: background 0.3s; }
  .add-cart-btn:hover { background: var(--gold); }
  .wish-btn { padding: 16px 20px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 1.2rem; color: var(--charcoal); font-weight: 700; line-height: 1; transition: all 0.2s; }
  .wish-btn:hover { background: var(--charcoal); color: white; }
  .wish-btn.active { background: var(--gold); color: white; border-color: var(--gold); }

  @media (max-width: 768px) {
    .navbar { padding: 0 20px; }
    .nav-links { display: none; }
    .hero-title { font-size: clamp(2.2rem, 10vw, 4rem); }
    .categories-strip { grid-template-columns: 1fr; }
    .category-card { aspect-ratio: 2/1; }
    .section { padding: 60px 20px; }
    .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
    .cart-drawer { width: 100vw; }
    .shop-layout { padding: 88px 20px 60px; }
    .profile-layout { padding: 88px 20px 60px; }
    .product-detail { grid-template-columns: 1fr; padding: 88px 20px 60px; gap: 32px; }
    .form-row-two { grid-template-columns: 1fr; }
  }
`;

const styleTag = document.createElement("style");
styleTag.textContent = css;
document.head.appendChild(styleTag);

// ─── Products ─────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: 1, name: "Draped Silk Blouse", brand: "Maison Élite", price: 245, category: "Women", badge: "New", emoji: "👘", bg: ["#F5EEE6","#EDE4D8"], desc: "Luxuriously soft silk blouse with an elegant drape. Perfect for formal occasions and upscale casual wear.", sizes: ["XS","S","M","L","XL"] },
  { id: 2, name: "Tailored Wool Blazer", brand: "L'Atelier", price: 480, category: "Men", badge: null, emoji: "🧥", bg: ["#E8ECF0","#D8DDE3"], desc: "Precision-tailored blazer crafted from merino wool. A wardrobe staple for boardroom to evening.", sizes: ["S","M","L","XL","XXL"] },
  { id: 3, name: "Sculptural Handbag", brand: "Cour Royal", price: 620, category: "Accessories", badge: "Bestseller", emoji: "👜", bg: ["#F0EAE0","#E8DDD0"], desc: "Architectural handbag handcrafted in full-grain leather. An investment piece that defines every look.", sizes: ["One Size"] },
  { id: 4, name: "Wide-Leg Trousers", brand: "Maison Élite", price: 310, category: "Women", badge: null, emoji: "👖", bg: ["#EDEAE5","#E0DCCF"], desc: "Fluid wide-leg trousers in sustainable tencel. Elevated comfort with an impeccable silhouette.", sizes: ["XS","S","M","L","XL"] },
  { id: 5, name: "Oxford Leather Shoes", brand: "Brun & Co.", price: 395, category: "Men", badge: null, emoji: "👞", bg: ["#E8E0D0","#DDD5C0"], desc: "Hand-stitched Oxford shoes in burnished calfskin leather. Classic craftsmanship for the discerning gentleman.", sizes: ["40","41","42","43","44","45"] },
  { id: 6, name: "Cashmere Scarf", brand: "Montagne", price: 185, category: "Accessories", badge: "Sale", emoji: "🧣", bg: ["#F0ECE4","#E8E0D4"], desc: "Pure cashmere scarf woven in Scotland. Incredibly soft with a refined herringbone pattern.", sizes: ["One Size"] },
  { id: 7, name: "Slip Midi Dress", brand: "Soirée", price: 295, category: "Women", badge: "New", emoji: "👗", bg: ["#EEE8F0","#E4DDE8"], desc: "Bias-cut midi dress in liquid satin. Effortlessly elegant for any occasion.", sizes: ["XS","S","M","L"] },
  { id: 8, name: "Slim Fit Chinos", brand: "L'Atelier", price: 195, category: "Men", badge: null, emoji: "🩲", bg: ["#EAE8E0","#DDDAC8"], desc: "Slim fit chinos in stretch cotton twill. Versatile, refined, and impeccably comfortable.", sizes: ["S","M","L","XL","XXL"] },
  { id: 9, name: "Gold Hoop Earrings", brand: "Cour Royal", price: 145, category: "Accessories", badge: null, emoji: "💍", bg: ["#F5F0E0","#EDE8D0"], desc: "Minimalist gold-plated hoop earrings. Lightweight yet statement-making.", sizes: ["One Size"] },
  { id: 10, name: "Linen Shirt Dress", brand: "Maison Élite", price: 265, category: "Women", badge: null, emoji: "👔", bg: ["#EEF0EA","#E4E8DC"], desc: "Relaxed shirt dress in washed Belgian linen. Understated sophistication.", sizes: ["XS","S","M","L","XL"] },
  { id: 11, name: "Merino Turtleneck", brand: "Montagne", price: 220, category: "Men", badge: "Bestseller", emoji: "🧶", bg: ["#E8EAF0","#D8DDE8"], desc: "Ultra-fine merino turtleneck in a versatile palette. An essential layer for colder months.", sizes: ["S","M","L","XL","XXL"] },
  { id: 12, name: "Leather Belt", brand: "Brun & Co.", price: 135, category: "Accessories", badge: null, emoji: "👑", bg: ["#EDE8E0","#E0D8CC"], desc: "Vegetable-tanned leather belt with a polished brass buckle. The finishing touch every outfit deserves.", sizes: ["70cm","75cm","80cm","85cm","90cm"] },
  { id: 13, name: "Organic Cotton Hoodie", brand: "Petit Atelier", price: 68, category: "Kids", badge: "New", emoji: "🧸", bg: ["#EAF3F0","#DDEBE5"], desc: "Soft brushed hoodie in organic cotton. Built for playground days and cozy evenings.", sizes: ["2Y","3Y","4Y","5Y","6Y","7Y","8Y"] },
  { id: 14, name: "Denim Overalls Set", brand: "Petit Atelier", price: 82, category: "Kids", badge: null, emoji: "🧒", bg: ["#E9EDF5","#D8E0EF"], desc: "Classic denim overalls with an easy-fit tee. Durable, comfortable, and timeless.", sizes: ["2Y","3Y","4Y","5Y","6Y"] },
  { id: 15, name: "Rain Jacket", brand: "Nord Mini", price: 95, category: "Kids", badge: "Bestseller", emoji: "🌧️", bg: ["#EEF6F9","#DCECF3"], desc: "Lightweight waterproof jacket with sealed seams. Keeps little explorers dry in style.", sizes: ["3Y","4Y","5Y","6Y","7Y","8Y"] },
  { id: 16, name: "Knit Beanie + Scarf", brand: "Nord Mini", price: 48, category: "Kids", badge: "Sale", emoji: "🧣", bg: ["#F2F0EA","#E5E2D6"], desc: "Warm knit set in a soft blend. Perfect for chilly mornings and weekend walks.", sizes: ["One Size"] },
];

const COUNTRY_OPTIONS = [
  {
    "code": "AF",
    "name": "Afghanistan",
    "flag": "🇦🇫",
    "dial": "+93"
  },
  {
    "code": "AL",
    "name": "Albania",
    "flag": "🇦🇱",
    "dial": "+355"
  },
  {
    "code": "DZ",
    "name": "Algeria",
    "flag": "🇩🇿",
    "dial": "+213"
  },
  {
    "code": "AD",
    "name": "Andorra",
    "flag": "🇦🇩",
    "dial": "+376"
  },
  {
    "code": "AO",
    "name": "Angola",
    "flag": "🇦🇴",
    "dial": "+244"
  },
  {
    "code": "AG",
    "name": "Antigua and Barbuda",
    "flag": "🇦🇬",
    "dial": "+1268"
  },
  {
    "code": "AR",
    "name": "Argentina",
    "flag": "🇦🇷",
    "dial": "+54"
  },
  {
    "code": "AM",
    "name": "Armenia",
    "flag": "🇦🇲",
    "dial": "+374"
  },
  {
    "code": "AU",
    "name": "Australia",
    "flag": "🇦🇺",
    "dial": "+61"
  },
  {
    "code": "AT",
    "name": "Austria",
    "flag": "🇦🇹",
    "dial": "+43"
  },
  {
    "code": "AZ",
    "name": "Azerbaijan",
    "flag": "🇦🇿",
    "dial": "+994"
  },
  {
    "code": "BS",
    "name": "Bahamas",
    "flag": "🇧🇸",
    "dial": "+1242"
  },
  {
    "code": "BH",
    "name": "Bahrain",
    "flag": "🇧🇭",
    "dial": "+973"
  },
  {
    "code": "BD",
    "name": "Bangladesh",
    "flag": "🇧🇩",
    "dial": "+880"
  },
  {
    "code": "BB",
    "name": "Barbados",
    "flag": "🇧🇧",
    "dial": "+1246"
  },
  {
    "code": "BY",
    "name": "Belarus",
    "flag": "🇧🇾",
    "dial": "+375"
  },
  {
    "code": "BE",
    "name": "Belgium",
    "flag": "🇧🇪",
    "dial": "+32"
  },
  {
    "code": "BZ",
    "name": "Belize",
    "flag": "🇧🇿",
    "dial": "+501"
  },
  {
    "code": "BJ",
    "name": "Benin",
    "flag": "🇧🇯",
    "dial": "+229"
  },
  {
    "code": "BT",
    "name": "Bhutan",
    "flag": "🇧🇹",
    "dial": "+975"
  },
  {
    "code": "BO",
    "name": "Bolivia",
    "flag": "🇧🇴",
    "dial": "+591"
  },
  {
    "code": "BA",
    "name": "Bosnia and Herzegovina",
    "flag": "🇧🇦",
    "dial": "+387"
  },
  {
    "code": "BW",
    "name": "Botswana",
    "flag": "🇧🇼",
    "dial": "+267"
  },
  {
    "code": "BR",
    "name": "Brazil",
    "flag": "🇧🇷",
    "dial": "+55"
  },
  {
    "code": "BN",
    "name": "Brunei",
    "flag": "🇧🇳",
    "dial": "+673"
  },
  {
    "code": "BG",
    "name": "Bulgaria",
    "flag": "🇧🇬",
    "dial": "+359"
  },
  {
    "code": "BF",
    "name": "Burkina Faso",
    "flag": "🇧🇫",
    "dial": "+226"
  },
  {
    "code": "BI",
    "name": "Burundi",
    "flag": "🇧🇮",
    "dial": "+257"
  },
  {
    "code": "KH",
    "name": "Cambodia",
    "flag": "🇰🇭",
    "dial": "+855"
  },
  {
    "code": "CM",
    "name": "Cameroon",
    "flag": "🇨🇲",
    "dial": "+237"
  },
  {
    "code": "CA",
    "name": "Canada",
    "flag": "🇨🇦",
    "dial": "+1"
  },
  {
    "code": "CV",
    "name": "Cape Verde",
    "flag": "🇨🇻",
    "dial": "+238"
  },
  {
    "code": "CF",
    "name": "Central African Republic",
    "flag": "🇨🇫",
    "dial": "+236"
  },
  {
    "code": "TD",
    "name": "Chad",
    "flag": "🇹🇩",
    "dial": "+235"
  },
  {
    "code": "CL",
    "name": "Chile",
    "flag": "🇨🇱",
    "dial": "+56"
  },
  {
    "code": "CN",
    "name": "China",
    "flag": "🇨🇳",
    "dial": "+86"
  },
  {
    "code": "CO",
    "name": "Colombia",
    "flag": "🇨🇴",
    "dial": "+57"
  },
  {
    "code": "KM",
    "name": "Comoros",
    "flag": "🇰🇲",
    "dial": "+269"
  },
  {
    "code": "CR",
    "name": "Costa Rica",
    "flag": "🇨🇷",
    "dial": "+506"
  },
  {
    "code": "HR",
    "name": "Croatia",
    "flag": "🇭🇷",
    "dial": "+385"
  },
  {
    "code": "CU",
    "name": "Cuba",
    "flag": "🇨🇺",
    "dial": "+53"
  },
  {
    "code": "CY",
    "name": "Cyprus",
    "flag": "🇨🇾",
    "dial": "+357"
  },
  {
    "code": "CZ",
    "name": "Czechia",
    "flag": "🇨🇿",
    "dial": "+420"
  },
  {
    "code": "DK",
    "name": "Denmark",
    "flag": "🇩🇰",
    "dial": "+45"
  },
  {
    "code": "DJ",
    "name": "Djibouti",
    "flag": "🇩🇯",
    "dial": "+253"
  },
  {
    "code": "DM",
    "name": "Dominica",
    "flag": "🇩🇲",
    "dial": "+1767"
  },
  {
    "code": "DO",
    "name": "Dominican Republic",
    "flag": "🇩🇴",
    "dial": "+1809"
  },
  {
    "code": "CD",
    "name": "DR Congo",
    "flag": "🇨🇩",
    "dial": "+243"
  },
  {
    "code": "EC",
    "name": "Ecuador",
    "flag": "🇪🇨",
    "dial": "+593"
  },
  {
    "code": "EG",
    "name": "Egypt",
    "flag": "🇪🇬",
    "dial": "+20"
  },
  {
    "code": "SV",
    "name": "El Salvador",
    "flag": "🇸🇻",
    "dial": "+503"
  },
  {
    "code": "GQ",
    "name": "Equatorial Guinea",
    "flag": "🇬🇶",
    "dial": "+240"
  },
  {
    "code": "ER",
    "name": "Eritrea",
    "flag": "🇪🇷",
    "dial": "+291"
  },
  {
    "code": "EE",
    "name": "Estonia",
    "flag": "🇪🇪",
    "dial": "+372"
  },
  {
    "code": "SZ",
    "name": "Eswatini",
    "flag": "🇸🇿",
    "dial": "+268"
  },
  {
    "code": "ET",
    "name": "Ethiopia",
    "flag": "🇪🇹",
    "dial": "+251"
  },
  {
    "code": "FJ",
    "name": "Fiji",
    "flag": "🇫🇯",
    "dial": "+679"
  },
  {
    "code": "FI",
    "name": "Finland",
    "flag": "🇫🇮",
    "dial": "+358"
  },
  {
    "code": "FR",
    "name": "France",
    "flag": "🇫🇷",
    "dial": "+33"
  },
  {
    "code": "GA",
    "name": "Gabon",
    "flag": "🇬🇦",
    "dial": "+241"
  },
  {
    "code": "GM",
    "name": "Gambia",
    "flag": "🇬🇲",
    "dial": "+220"
  },
  {
    "code": "GE",
    "name": "Georgia",
    "flag": "🇬🇪",
    "dial": "+995"
  },
  {
    "code": "DE",
    "name": "Germany",
    "flag": "🇩🇪",
    "dial": "+49"
  },
  {
    "code": "GH",
    "name": "Ghana",
    "flag": "🇬🇭",
    "dial": "+233"
  },
  {
    "code": "GR",
    "name": "Greece",
    "flag": "🇬🇷",
    "dial": "+30"
  },
  {
    "code": "GD",
    "name": "Grenada",
    "flag": "🇬🇩",
    "dial": "+1473"
  },
  {
    "code": "GT",
    "name": "Guatemala",
    "flag": "🇬🇹",
    "dial": "+502"
  },
  {
    "code": "GN",
    "name": "Guinea",
    "flag": "🇬🇳",
    "dial": "+224"
  },
  {
    "code": "GY",
    "name": "Guyana",
    "flag": "🇬🇾",
    "dial": "+592"
  },
  {
    "code": "HT",
    "name": "Haiti",
    "flag": "🇭🇹",
    "dial": "+509"
  },
  {
    "code": "HN",
    "name": "Honduras",
    "flag": "🇭🇳",
    "dial": "+504"
  },
  {
    "code": "HU",
    "name": "Hungary",
    "flag": "🇭🇺",
    "dial": "+36"
  },
  {
    "code": "IS",
    "name": "Iceland",
    "flag": "🇮🇸",
    "dial": "+354"
  },
  {
    "code": "IN",
    "name": "India",
    "flag": "🇮🇳",
    "dial": "+91"
  },
  {
    "code": "ID",
    "name": "Indonesia",
    "flag": "🇮🇩",
    "dial": "+62"
  },
  {
    "code": "IR",
    "name": "Iran",
    "flag": "🇮🇷",
    "dial": "+98"
  },
  {
    "code": "IQ",
    "name": "Iraq",
    "flag": "🇮🇶",
    "dial": "+964"
  },
  {
    "code": "IE",
    "name": "Ireland",
    "flag": "🇮🇪",
    "dial": "+353"
  },
  {
    "code": "IL",
    "name": "Israel",
    "flag": "🇮🇱",
    "dial": "+972"
  },
  {
    "code": "IT",
    "name": "Italy",
    "flag": "🇮🇹",
    "dial": "+39"
  },
  {
    "code": "CI",
    "name": "Ivory Coast",
    "flag": "🇨🇮",
    "dial": "+225"
  },
  {
    "code": "JM",
    "name": "Jamaica",
    "flag": "🇯🇲",
    "dial": "+1876"
  },
  {
    "code": "JP",
    "name": "Japan",
    "flag": "🇯🇵",
    "dial": "+81"
  },
  {
    "code": "JO",
    "name": "Jordan",
    "flag": "🇯🇴",
    "dial": "+962"
  },
  {
    "code": "KZ",
    "name": "Kazakhstan",
    "flag": "🇰🇿",
    "dial": "+76"
  },
  {
    "code": "KE",
    "name": "Kenya",
    "flag": "🇰🇪",
    "dial": "+254"
  },
  {
    "code": "KI",
    "name": "Kiribati",
    "flag": "🇰🇮",
    "dial": "+686"
  },
  {
    "code": "KW",
    "name": "Kuwait",
    "flag": "🇰🇼",
    "dial": "+965"
  },
  {
    "code": "KG",
    "name": "Kyrgyzstan",
    "flag": "🇰🇬",
    "dial": "+996"
  },
  {
    "code": "LA",
    "name": "Laos",
    "flag": "🇱🇦",
    "dial": "+856"
  },
  {
    "code": "LV",
    "name": "Latvia",
    "flag": "🇱🇻",
    "dial": "+371"
  },
  {
    "code": "LB",
    "name": "Lebanon",
    "flag": "🇱🇧",
    "dial": "+961"
  },
  {
    "code": "LS",
    "name": "Lesotho",
    "flag": "🇱🇸",
    "dial": "+266"
  },
  {
    "code": "LR",
    "name": "Liberia",
    "flag": "🇱🇷",
    "dial": "+231"
  },
  {
    "code": "LY",
    "name": "Libya",
    "flag": "🇱🇾",
    "dial": "+218"
  },
  {
    "code": "LI",
    "name": "Liechtenstein",
    "flag": "🇱🇮",
    "dial": "+423"
  },
  {
    "code": "LT",
    "name": "Lithuania",
    "flag": "🇱🇹",
    "dial": "+370"
  },
  {
    "code": "LU",
    "name": "Luxembourg",
    "flag": "🇱🇺",
    "dial": "+352"
  },
  {
    "code": "MG",
    "name": "Madagascar",
    "flag": "🇲🇬",
    "dial": "+261"
  },
  {
    "code": "MW",
    "name": "Malawi",
    "flag": "🇲🇼",
    "dial": "+265"
  },
  {
    "code": "MY",
    "name": "Malaysia",
    "flag": "🇲🇾",
    "dial": "+60"
  },
  {
    "code": "MV",
    "name": "Maldives",
    "flag": "🇲🇻",
    "dial": "+960"
  },
  {
    "code": "ML",
    "name": "Mali",
    "flag": "🇲🇱",
    "dial": "+223"
  },
  {
    "code": "MT",
    "name": "Malta",
    "flag": "🇲🇹",
    "dial": "+356"
  },
  {
    "code": "MH",
    "name": "Marshall Islands",
    "flag": "🇲🇭",
    "dial": "+692"
  },
  {
    "code": "MR",
    "name": "Mauritania",
    "flag": "🇲🇷",
    "dial": "+222"
  },
  {
    "code": "MU",
    "name": "Mauritius",
    "flag": "🇲🇺",
    "dial": "+230"
  },
  {
    "code": "MX",
    "name": "Mexico",
    "flag": "🇲🇽",
    "dial": "+52"
  },
  {
    "code": "FM",
    "name": "Micronesia",
    "flag": "🇫🇲",
    "dial": "+691"
  },
  {
    "code": "MD",
    "name": "Moldova",
    "flag": "🇲🇩",
    "dial": "+373"
  },
  {
    "code": "MC",
    "name": "Monaco",
    "flag": "🇲🇨",
    "dial": "+377"
  },
  {
    "code": "MN",
    "name": "Mongolia",
    "flag": "🇲🇳",
    "dial": "+976"
  },
  {
    "code": "ME",
    "name": "Montenegro",
    "flag": "🇲🇪",
    "dial": "+382"
  },
  {
    "code": "MA",
    "name": "Morocco",
    "flag": "🇲🇦",
    "dial": "+212"
  },
  {
    "code": "MZ",
    "name": "Mozambique",
    "flag": "🇲🇿",
    "dial": "+258"
  },
  {
    "code": "MM",
    "name": "Myanmar",
    "flag": "🇲🇲",
    "dial": "+95"
  },
  {
    "code": "NA",
    "name": "Namibia",
    "flag": "🇳🇦",
    "dial": "+264"
  },
  {
    "code": "NR",
    "name": "Nauru",
    "flag": "🇳🇷",
    "dial": "+674"
  },
  {
    "code": "NP",
    "name": "Nepal",
    "flag": "🇳🇵",
    "dial": "+977"
  },
  {
    "code": "NL",
    "name": "Netherlands",
    "flag": "🇳🇱",
    "dial": "+31"
  },
  {
    "code": "NZ",
    "name": "New Zealand",
    "flag": "🇳🇿",
    "dial": "+64"
  },
  {
    "code": "NI",
    "name": "Nicaragua",
    "flag": "🇳🇮",
    "dial": "+505"
  },
  {
    "code": "NE",
    "name": "Niger",
    "flag": "🇳🇪",
    "dial": "+227"
  },
  {
    "code": "NG",
    "name": "Nigeria",
    "flag": "🇳🇬",
    "dial": "+234"
  },
  {
    "code": "KP",
    "name": "North Korea",
    "flag": "🇰🇵",
    "dial": "+850"
  },
  {
    "code": "MK",
    "name": "North Macedonia",
    "flag": "🇲🇰",
    "dial": "+389"
  },
  {
    "code": "NO",
    "name": "Norway",
    "flag": "🇳🇴",
    "dial": "+47"
  },
  {
    "code": "OM",
    "name": "Oman",
    "flag": "🇴🇲",
    "dial": "+968"
  },
  {
    "code": "PK",
    "name": "Pakistan",
    "flag": "🇵🇰",
    "dial": "+92"
  },
  {
    "code": "PW",
    "name": "Palau",
    "flag": "🇵🇼",
    "dial": "+680"
  },
  {
    "code": "PS",
    "name": "Palestine",
    "flag": "🇵🇸",
    "dial": "+970"
  },
  {
    "code": "PA",
    "name": "Panama",
    "flag": "🇵🇦",
    "dial": "+507"
  },
  {
    "code": "PG",
    "name": "Papua New Guinea",
    "flag": "🇵🇬",
    "dial": "+675"
  },
  {
    "code": "PY",
    "name": "Paraguay",
    "flag": "🇵🇾",
    "dial": "+595"
  },
  {
    "code": "PE",
    "name": "Peru",
    "flag": "🇵🇪",
    "dial": "+51"
  },
  {
    "code": "PH",
    "name": "Philippines",
    "flag": "🇵🇭",
    "dial": "+63"
  },
  {
    "code": "PL",
    "name": "Poland",
    "flag": "🇵🇱",
    "dial": "+48"
  },
  {
    "code": "PT",
    "name": "Portugal",
    "flag": "🇵🇹",
    "dial": "+351"
  },
  {
    "code": "QA",
    "name": "Qatar",
    "flag": "🇶🇦",
    "dial": "+974"
  },
  {
    "code": "CG",
    "name": "Republic of the Congo",
    "flag": "🇨🇬",
    "dial": "+242"
  },
  {
    "code": "RO",
    "name": "Romania",
    "flag": "🇷🇴",
    "dial": "+40"
  },
  {
    "code": "RU",
    "name": "Russia",
    "flag": "🇷🇺",
    "dial": "+73"
  },
  {
    "code": "RW",
    "name": "Rwanda",
    "flag": "🇷🇼",
    "dial": "+250"
  },
  {
    "code": "KN",
    "name": "Saint Kitts and Nevis",
    "flag": "🇰🇳",
    "dial": "+1869"
  },
  {
    "code": "LC",
    "name": "Saint Lucia",
    "flag": "🇱🇨",
    "dial": "+1758"
  },
  {
    "code": "VC",
    "name": "Saint Vincent and the Grenadines",
    "flag": "🇻🇨",
    "dial": "+1784"
  },
  {
    "code": "WS",
    "name": "Samoa",
    "flag": "🇼🇸",
    "dial": "+685"
  },
  {
    "code": "SM",
    "name": "San Marino",
    "flag": "🇸🇲",
    "dial": "+378"
  },
  {
    "code": "ST",
    "name": "São Tomé and Príncipe",
    "flag": "🇸🇹",
    "dial": "+239"
  },
  {
    "code": "SA",
    "name": "Saudi Arabia",
    "flag": "🇸🇦",
    "dial": "+966"
  },
  {
    "code": "SN",
    "name": "Senegal",
    "flag": "🇸🇳",
    "dial": "+221"
  },
  {
    "code": "RS",
    "name": "Serbia",
    "flag": "🇷🇸",
    "dial": "+381"
  },
  {
    "code": "SC",
    "name": "Seychelles",
    "flag": "🇸🇨",
    "dial": "+248"
  },
  {
    "code": "SL",
    "name": "Sierra Leone",
    "flag": "🇸🇱",
    "dial": "+232"
  },
  {
    "code": "SG",
    "name": "Singapore",
    "flag": "🇸🇬",
    "dial": "+65"
  },
  {
    "code": "SK",
    "name": "Slovakia",
    "flag": "🇸🇰",
    "dial": "+421"
  },
  {
    "code": "SI",
    "name": "Slovenia",
    "flag": "🇸🇮",
    "dial": "+386"
  },
  {
    "code": "SB",
    "name": "Solomon Islands",
    "flag": "🇸🇧",
    "dial": "+677"
  },
  {
    "code": "SO",
    "name": "Somalia",
    "flag": "🇸🇴",
    "dial": "+252"
  },
  {
    "code": "ZA",
    "name": "South Africa",
    "flag": "🇿🇦",
    "dial": "+27"
  },
  {
    "code": "KR",
    "name": "South Korea",
    "flag": "🇰🇷",
    "dial": "+82"
  },
  {
    "code": "SS",
    "name": "South Sudan",
    "flag": "🇸🇸",
    "dial": "+211"
  },
  {
    "code": "ES",
    "name": "Spain",
    "flag": "🇪🇸",
    "dial": "+34"
  },
  {
    "code": "LK",
    "name": "Sri Lanka",
    "flag": "🇱🇰",
    "dial": "+94"
  },
  {
    "code": "SD",
    "name": "Sudan",
    "flag": "🇸🇩",
    "dial": "+249"
  },
  {
    "code": "SR",
    "name": "Suriname",
    "flag": "🇸🇷",
    "dial": "+597"
  },
  {
    "code": "SE",
    "name": "Sweden",
    "flag": "🇸🇪",
    "dial": "+46"
  },
  {
    "code": "CH",
    "name": "Switzerland",
    "flag": "🇨🇭",
    "dial": "+41"
  },
  {
    "code": "SY",
    "name": "Syria",
    "flag": "🇸🇾",
    "dial": "+963"
  },
  {
    "code": "TW",
    "name": "Taiwan",
    "flag": "🇹🇼",
    "dial": "+886"
  },
  {
    "code": "TJ",
    "name": "Tajikistan",
    "flag": "🇹🇯",
    "dial": "+992"
  },
  {
    "code": "TZ",
    "name": "Tanzania",
    "flag": "🇹🇿",
    "dial": "+255"
  },
  {
    "code": "TH",
    "name": "Thailand",
    "flag": "🇹🇭",
    "dial": "+66"
  },
  {
    "code": "TL",
    "name": "Timor-Leste",
    "flag": "🇹🇱",
    "dial": "+670"
  },
  {
    "code": "TG",
    "name": "Togo",
    "flag": "🇹🇬",
    "dial": "+228"
  },
  {
    "code": "TO",
    "name": "Tonga",
    "flag": "🇹🇴",
    "dial": "+676"
  },
  {
    "code": "TT",
    "name": "Trinidad and Tobago",
    "flag": "🇹🇹",
    "dial": "+1868"
  },
  {
    "code": "TN",
    "name": "Tunisia",
    "flag": "🇹🇳",
    "dial": "+216"
  },
  {
    "code": "TR",
    "name": "Turkey",
    "flag": "🇹🇷",
    "dial": "+90"
  },
  {
    "code": "TM",
    "name": "Turkmenistan",
    "flag": "🇹🇲",
    "dial": "+993"
  },
  {
    "code": "TV",
    "name": "Tuvalu",
    "flag": "🇹🇻",
    "dial": "+688"
  },
  {
    "code": "UG",
    "name": "Uganda",
    "flag": "🇺🇬",
    "dial": "+256"
  },
  {
    "code": "UA",
    "name": "Ukraine",
    "flag": "🇺🇦",
    "dial": "+380"
  },
  {
    "code": "AE",
    "name": "United Arab Emirates",
    "flag": "🇦🇪",
    "dial": "+971"
  },
  {
    "code": "GB",
    "name": "United Kingdom",
    "flag": "🇬🇧",
    "dial": "+44"
  },
  {
    "code": "US",
    "name": "United States",
    "flag": "🇺🇸",
    "dial": "+1201"
  },
  {
    "code": "UY",
    "name": "Uruguay",
    "flag": "🇺🇾",
    "dial": "+598"
  },
  {
    "code": "UZ",
    "name": "Uzbekistan",
    "flag": "🇺🇿",
    "dial": "+998"
  },
  {
    "code": "VU",
    "name": "Vanuatu",
    "flag": "🇻🇺",
    "dial": "+678"
  },
  {
    "code": "VA",
    "name": "Vatican City",
    "flag": "🇻🇦",
    "dial": "+3906698"
  },
  {
    "code": "VE",
    "name": "Venezuela",
    "flag": "🇻🇪",
    "dial": "+58"
  },
  {
    "code": "VN",
    "name": "Vietnam",
    "flag": "🇻🇳",
    "dial": "+84"
  },
  {
    "code": "YE",
    "name": "Yemen",
    "flag": "🇾🇪",
    "dial": "+967"
  },
  {
    "code": "ZM",
    "name": "Zambia",
    "flag": "🇿🇲",
    "dial": "+260"
  },
  {
    "code": "ZW",
    "name": "Zimbabwe",
    "flag": "🇿🇼",
    "dial": "+263"
  }
].sort((a, b) => a.name.localeCompare(b.name));

const CHECKOUT_CACHE_KEY = "velours_checkout_draft_v1";
const COOKIE_CONSENT_KEY = "velours_cookie_consent_v1";
const USER_PROFILE_VERSION = 2;

const fmt = (n) => `$${n.toLocaleString()}`;

// ─── localStorage helpers ──────────────────────────────────────────────────────
const LS = {
  getUser: (email) => {
    try { const d = localStorage.getItem(`velours_user_${email}`); return d ? JSON.parse(d) : null; } catch { return null; }
  },
  saveUser: (user) => {
    try { localStorage.setItem(`velours_user_${user.email}`, JSON.stringify(user)); } catch {}
  },
  getSession: () => {
    try { const d = localStorage.getItem("velours_session"); return d ? JSON.parse(d) : null; } catch { return null; }
  },
  saveSession: (email) => {
    try { localStorage.setItem("velours_session", JSON.stringify({ email })); } catch {}
  },
  clearSession: () => {
    try { localStorage.removeItem("velours_session"); } catch {}
  },
};

const readCookieConsent = () => {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const writeCookieConsent = (consent) => {
  try { localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent)); } catch {}
};

const splitName = (full) => {
  const safe = String(full || "").trim().replace(/\s+/g, " ");
  if (!safe) return { firstName: "", lastName: "" };
  const parts = safe.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const fullName = ({ firstName, lastName }) =>
  `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();

const normalizeUser = (u) => {
  if (!u || typeof u !== "object") return u;
  const next = { ...u };
  if (!next.profile || typeof next.profile !== "object") next.profile = {};
  if (!next.version) next.version = 1;

  if (!next.firstName && !next.lastName) {
    const fromName = splitName(next.name);
    next.firstName = fromName.firstName;
    next.lastName = fromName.lastName;
  }

  if (!next.name) next.name = fullName({ firstName: next.firstName, lastName: next.lastName });

  next.version = USER_PROFILE_VERSION;
  return next;
};

const isStrongPassword = (pw) => {
  const s = String(pw || "");
  // at least 8 chars, 1 upper, 1 lower, 1 number, 1 special
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(s);
};

const getPasswordChecks = (pw) => {
  const s = String(pw || "");
  return {
    length: s.length >= 8,
    upper: /[A-Z]/.test(s),
    lower: /[a-z]/.test(s),
    number: /\d/.test(s),
    symbol: /[^A-Za-z0-9]/.test(s),
  };
};

// ─── Toast hook ───────────────────────────────────────────────────────────────
let toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "default") => {
    const id = ++toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.map(x => x.id === id ? { ...x, removing: true } : x)), 2800);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };
  return { toasts, add };
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payConfirmOrder, setPayConfirmOrder] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [cookieConsent, setCookieConsent] = useState(null);
  const [cookieOpen, setCookieOpen] = useState(false);
  const [checkoutDraft, setCheckoutDraft] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    phoneCode: "+1",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    deliveryType: "standard",
    paymentMethod: "visa",
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    markAsDue: false,
  });
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [promoCode, setPromoCode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shopFilter, setShopFilter] = useState("All");
  const [shopSort, setShopSort] = useState("featured");
  const [scrolled, setScrolled] = useState(false);
  const [profileTab, setProfileTab] = useState("orders");
  const { toasts, add: addToast } = useToast();
  const dialForCountry = (code) => COUNTRY_OPTIONS.find(c => c.code === code)?.dial || "+1";

  useEffect(() => {
    document.title = "sanjiiiii";
  }, []);

  // Restore session
  useEffect(() => {
    const session = LS.getSession();
    if (session) {
      const u = normalizeUser(LS.getUser(session.email));
      if (u) { LS.saveUser(u); setUser(u); setCart(u.cart || []); setWishlist(u.wishlist || []); }
    }
  }, []);

  // Cookie consent (GDPR)
  useEffect(() => {
    const existing = readCookieConsent();
    if (existing && existing.version === 1) {
      setCookieConsent(existing);
      return;
    }
    setCookieOpen(true);
  }, []);

  // Allow reopening cookie settings anytime
  useEffect(() => {
    const handler = () => setCookieOpen(true);
    window.addEventListener("velours:cookie-settings", handler);
    return () => window.removeEventListener("velours:cookie-settings", handler);
  }, []);

  const saveCookieConsent = (next) => {
    const consent = { ...next, version: 1, updatedAt: new Date().toISOString() };
    setCookieConsent(consent);
    writeCookieConsent(consent);
    setCookieOpen(false);
    addToast("Cookie preferences saved.", "success");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-fill checkout from saved profile to reduce typing
  useEffect(() => {
    if (!checkoutOpen || !user) return;
    const u = normalizeUser(user);
    const p = u.profile || {};
    setCheckoutDraft((prev) => ({
      ...prev,
      firstName: prev.firstName || u.firstName || "",
      lastName: prev.lastName || u.lastName || "",
      email: prev.email || u.email || "",
      country: prev.country || p.country || "",
      phoneCode: dialForCountry((prev.country || p.country) || "US"),
      address: prev.address || p.address || "",
      city: prev.city || p.city || "",
      state: prev.state || p.state || "",
      postalCode: prev.postalCode || p.postalCode || "",
    }));
  }, [checkoutOpen, user]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKOUT_CACHE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw);
      if (!cached || typeof cached !== "object") return;
      const country = cached.country || "";
      setCheckoutDraft((prev) => ({
        ...prev,
        firstName: cached.firstName || "",
        lastName: cached.lastName || "",
        email: cached.email || "",
        country,
        phoneCode: dialForCountry(country || "US"),
        address: cached.address || "",
        city: cached.city || "",
        state: cached.state || "",
        postalCode: cached.postalCode || "",
        deliveryType: cached.deliveryType || "standard",
        paymentMethod: cached.paymentMethod || "visa",
        markAsDue: Boolean(cached.markAsDue),
      }));
      setPromoCode(cached.promoCode || "");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const safeDraft = {
        firstName: checkoutDraft.firstName,
        lastName: checkoutDraft.lastName,
        email: checkoutDraft.email,
        country: checkoutDraft.country,
        address: checkoutDraft.address,
        city: checkoutDraft.city,
        state: checkoutDraft.state,
        postalCode: checkoutDraft.postalCode,
        deliveryType: checkoutDraft.deliveryType,
        paymentMethod: checkoutDraft.paymentMethod,
        markAsDue: checkoutDraft.markAsDue,
        promoCode,
      };
      localStorage.setItem(CHECKOUT_CACHE_KEY, JSON.stringify(safeDraft));
    } catch {}
  }, [
    checkoutDraft.firstName,
    checkoutDraft.lastName,
    checkoutDraft.email,
    checkoutDraft.country,
    checkoutDraft.address,
    checkoutDraft.city,
    checkoutDraft.state,
    checkoutDraft.postalCode,
    checkoutDraft.deliveryType,
    checkoutDraft.paymentMethod,
    checkoutDraft.markAsDue,
    promoCode,
  ]);

  const persist = (newCart, newWishlist, currentUser, newOrders = null) => {
    if (!currentUser) return;
    const updated = {
      ...normalizeUser(currentUser),
      cart: newCart,
      wishlist: newWishlist,
      orders: newOrders ?? (currentUser.orders || []),
    };
    LS.saveUser(updated);
    setUser(updated);
  };

  const updateUserProfile = (patch) => {
    if (!user) return;
    const base = normalizeUser(user);
    const next = normalizeUser({
      ...base,
      ...patch,
      profile: { ...(base.profile || {}), ...(patch?.profile || {}) },
    });
    next.name = fullName({ firstName: next.firstName, lastName: next.lastName });
    LS.saveUser(next);
    setUser(next);
  };

  const addToCart = (product, size) => {
    const existing = cart.findIndex(i => i.product.id === product.id && i.size === size);
    let newCart;
    if (existing >= 0) {
      newCart = cart.map((i, idx) => idx === existing ? { ...i, qty: i.qty + 1 } : i);
    } else {
      newCart = [...cart, { product, size: size || product.sizes[0], qty: 1 }];
    }
    setCart(newCart);
    persist(newCart, wishlist, user);
    addToast(`${product.name} added to bag ✓`, "success");
    setCartOpen(true);
  };

  const removeFromCart = (idx) => {
    const newCart = cart.filter((_, i) => i !== idx);
    setCart(newCart);
    persist(newCart, wishlist, user);
  };

  const updateQty = (idx, delta) => {
    if (cart[idx].qty + delta < 1) { removeFromCart(idx); return; }
    const newCart = cart.map((i, x) => x === idx ? { ...i, qty: i.qty + delta } : i);
    setCart(newCart);
    persist(newCart, wishlist, user);
  };

  const toggleWishlist = (productId) => {
    const newWish = wishlist.includes(productId) ? wishlist.filter(id => id !== productId) : [...wishlist, productId];
    setWishlist(newWish);
    persist(cart, newWish, user);
    addToast(newWish.includes(productId) ? "Added to wishlist ♡" : "Removed from wishlist");
  };

  const login = ({ email, password, firstName, lastName }) => {
    let u = normalizeUser(LS.getUser(email));
    if (authMode === "register") {
      if (u) return "Email already registered.";
      const name = fullName({ firstName, lastName });
      u = normalizeUser({ email, password, firstName, lastName, name, profile: {}, cart: [], wishlist: [], orders: [] });
      LS.saveUser(u);
    } else {
      if (!u) return "No account found with this email.";
      if (u.password !== password) return "Incorrect password.";
    }
    const mergedCart = [...(u.cart || [])];
    for (const item of cart) {
      const ex = mergedCart.findIndex(i => i.product.id === item.product.id && i.size === item.size);
      if (ex >= 0) mergedCart[ex] = { ...mergedCart[ex], qty: mergedCart[ex].qty + item.qty };
      else mergedCart.push(item);
    }
    const mergedWish = [...new Set([...(u.wishlist || []), ...wishlist])];
    const finalUser = normalizeUser({ ...u, cart: mergedCart, wishlist: mergedWish });
    finalUser.name = fullName({ firstName: finalUser.firstName, lastName: finalUser.lastName }) || finalUser.name || "";
    LS.saveUser(finalUser);
    LS.saveSession(email);
    setUser(finalUser);
    setCart(mergedCart);
    setWishlist(mergedWish);
    setAuthOpen(false);
    addToast(`Welcome${authMode === "register" ? "" : " back"}, ${finalUser.name}! 👋`, "success");
    return null;
  };

  const logout = () => {
    LS.clearSession();
    setUser(null); setCart([]); setWishlist([]);
    setPage("home");
    addToast("Signed out successfully.");
  };

  const maskCard = (num) => {
    const clean = (num || "").replace(/\s+/g, "");
    if (clean.length < 4) return "****";
    return `**** **** **** ${clean.slice(-4)}`;
  };

  const formatCardNumber = (value) => {
    const digits = (value || "").replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value) => {
    const digits = (value || "").replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const isValidLuhn = (number) => {
    const digits = (number || "").replace(/\D/g, "");
    if (digits.length < 12) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i -= 1) {
      let d = Number(digits[i]);
      if (shouldDouble) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const genTxId = () => `TXN-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

  const getProductDiscount = (item) => item?.product?.badge === "Sale" ? item.product.price * 0.15 * item.qty : 0;
  const getPricing = () => {
    const shippingFee = checkoutDraft.deliveryType === "express" ? 20 : 8;
    const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
    const itemDiscount = cart.reduce((s, i) => s + getProductDiscount(i), 0);
    const discountedSubtotal = Math.max(0, subtotal - itemDiscount);
    const normalizedPromo = promoCode.trim().toUpperCase();
    const promoDiscount = normalizedPromo === "SAVE10" ? discountedSubtotal * 0.1 : 0;
    const total = Math.max(0, discountedSubtotal - promoDiscount + shippingFee);
    return { shippingFee, subtotal, itemDiscount, discountedSubtotal, promoDiscount, total, normalizedPromo };
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
    setCheckoutStep(1);
    setCheckoutErrors({});
    setPromoCode("");
  };

  const handleConfirmAddress = () => {
    const required = ["firstName", "lastName", "email", "country", "city", "postalCode"];
    const nextErrors = {};
    for (const key of required) {
      if (!checkoutDraft[key]?.trim()) nextErrors[key] = true;
    }
    if (checkoutDraft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutDraft.email)) {
      nextErrors.email = true;
      addToast("Please enter a valid email.");
    }
    if (Object.keys(nextErrors).length) {
      setCheckoutErrors(nextErrors);
      if (!nextErrors.email) addToast("Please fill required delivery fields.");
      return;
    }
    setCheckoutErrors({});
    setCheckoutStep(2);
  };

  const handleConfirmPayment = () => {
    if (promoCode.trim() && promoCode.trim().toUpperCase() !== "SAVE10") {
      addToast("Promo code is invalid. Try SAVE10 or leave blank.");
      return;
    }

    if (!checkoutDraft.markAsDue) {
      if (!checkoutDraft.cardHolder || !checkoutDraft.cardNumber || !checkoutDraft.expiry || !checkoutDraft.cvv) {
        addToast("Please fill payment card details.");
        return;
      }
      const cardDigits = checkoutDraft.cardNumber.replace(/\D/g, "");
      const cvvDigits = checkoutDraft.cvv.replace(/\D/g, "");
      const [mm, yy] = checkoutDraft.expiry.split("/");
      const month = Number(mm);
      const year = Number(yy);
      if (!isValidLuhn(cardDigits)) {
        addToast("Card number is invalid.");
        return;
      }
      if (!month || month < 1 || month > 12 || !year || yy?.length !== 2) {
        addToast("Expiry must be MM/YY.");
        return;
      }
      if (cvvDigits.length < 3 || cvvDigits.length > 4) {
        addToast("CVV must be 3 or 4 digits.");
        return;
      }
    }
    setCheckoutStep(3);
  };

  const handlePlaceOrder = () => {
    if (!user) {
      closeCheckout();
      setAuthMode("login");
      setAuthOpen(true);
      addToast("Sign in required to place an order.");
      return;
    }

    if (!cart.length) {
      addToast("Your bag is empty.");
      return;
    }

    const pricing = getPricing();
    const newOrder = {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: cart,
      subtotal: pricing.subtotal,
      shippingFee: pricing.shippingFee,
      itemDiscount: pricing.itemDiscount,
      promoCode: pricing.normalizedPromo || null,
      promoDiscount: pricing.promoDiscount,
      total: pricing.total,
      delivery: {
        type: checkoutDraft.deliveryType,
        firstName: checkoutDraft.firstName,
        lastName: checkoutDraft.lastName,
        fullName: `${checkoutDraft.firstName} ${checkoutDraft.lastName}`.trim(),
        email: checkoutDraft.email,
        country: checkoutDraft.country,
        phone: `${checkoutDraft.phoneCode} ${checkoutDraft.phone}`.trim(),
        address: checkoutDraft.address,
        city: checkoutDraft.city,
        state: checkoutDraft.state,
        postalCode: checkoutDraft.postalCode,
      },
      payment: {
        method: checkoutDraft.paymentMethod,
        cardMasked: checkoutDraft.markAsDue ? null : maskCard(checkoutDraft.cardNumber),
        status: checkoutDraft.markAsDue ? "due" : "completed",
        paidAt: checkoutDraft.markAsDue ? null : new Date().toISOString(),
        transactionId: checkoutDraft.markAsDue ? null : genTxId(),
      },
    };

    const updatedOrders = [newOrder, ...(user.orders || [])];
    setCart([]);
    persist([], wishlist, user, updatedOrders);
    closeCheckout();
    try { localStorage.removeItem(CHECKOUT_CACHE_KEY); } catch {}
    setCheckoutDraft({
      firstName: "",
      lastName: "",
      email: "",
      country: "",
      phoneCode: "+1",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      deliveryType: "standard",
      paymentMethod: "visa",
      cardHolder: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
      markAsDue: false,
    });
    addToast(`Order placed (${newOrder.id}) ✓`, "success");
    navigate("profile");
    setProfileTab("orders");
  };

  const handleOpenMarkPaid = (order) => {
    if (!user || !order) return;
    setPayConfirmOrder(order);
  };

  const handleConfirmMarkPaid = () => {
    if (!user || !payConfirmOrder) return;
    const orderId = payConfirmOrder.id;
    const updatedOrders = (user.orders || []).map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        payment: {
          ...o.payment,
          status: "completed",
          paidAt: new Date().toISOString(),
          transactionId: o.payment.transactionId || genTxId(),
        },
      };
    });
    persist(cart, wishlist, user, updatedOrders);
    setPayConfirmOrder(null);
    addToast(`Payment completed (${orderId})`, "success");
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const navigate = (p, product = null) => {
    if (product) setSelectedProduct(product);
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <button className="nav-logo" onClick={() => navigate("home")}>sanj<span>iiiii</span></button>
        <div className="nav-links">
          {[["home","Home"],["shop","Collection"],["about","About"]].map(([p,l]) => (
            <button key={p} className={`nav-link${page === p ? " active" : ""}`} onClick={() => navigate(p)}>{l}</button>
          ))}
        </div>
        <div className="nav-icons">
          <button className="icon-btn" onClick={() => navigate("shop")}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg>
          </button>
          <button className="icon-btn" onClick={() => user ? (setProfileTab("wishlist"), navigate("profile")) : setAuthOpen(true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
          </button>
          <button className="icon-btn" onClick={() => setCartOpen(true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
          {user ? (
            <button className="icon-btn" onClick={() => navigate("profile")}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:"var(--charcoal)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--gold)", fontFamily:"var(--font-serif)", fontWeight:600, fontSize:"0.85rem" }}>
                {user.name[0].toUpperCase()}
              </div>
            </button>
          ) : (
            <button className="btn-primary" style={{ padding:"8px 20px", fontSize:"0.65rem" }} onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>Sign In</button>
          )}
        </div>
      </nav>

      {page === "home" && <HomePage navigate={navigate} products={PRODUCTS} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} />}
      {page === "shop" && <ShopPage products={PRODUCTS} navigate={navigate} filter={shopFilter} setFilter={setShopFilter} sort={shopSort} setSort={setShopSort} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} />}
      {page === "product" && selectedProduct && <ProductDetailPage product={selectedProduct} navigate={navigate} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} />}
      {page === "profile" && <ProfilePage user={user} cart={cart} wishlist={wishlist} products={PRODUCTS} logout={logout} tab={profileTab} setTab={setProfileTab} navigate={navigate} onMarkOrderPaid={handleOpenMarkPaid} onUpdateProfile={updateUserProfile} />}
      {page === "about" && <AboutPage navigate={navigate} />}
      {page === "privacy" && <PrivacyPage navigate={navigate} />}
      {page === "terms" && <TermsPage navigate={navigate} />}

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          <div className="overlay-backdrop" onClick={() => setCartOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-header">
              <div className="cart-title">Shopping Bag <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:"var(--warm-gray)", fontWeight:400 }}>({cartCount})</span></div>
              <button className="close-btn" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-icon">🛍</div>
                <p>Your bag is empty</p>
                <button className="btn-primary" style={{ marginTop:24 }} onClick={() => { setCartOpen(false); navigate("shop"); }}>Explore Collection</button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item, i) => (
                    <div key={i} className="cart-item">
                      <div className="cart-item-img" style={{ background:`linear-gradient(135deg,${item.product.bg[0]},${item.product.bg[1]})` }}>{item.product.emoji}</div>
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.product.name}</div>
                        <div className="cart-item-meta">{item.product.brand} · Size {item.size}</div>
                        <div className="cart-item-price">{fmt(item.product.price)}</div>
                        <div className="qty-control">
                          <button className="qty-btn" onClick={() => updateQty(i, -1)}>−</button>
                          <span className="qty-num">{item.qty}</span>
                          <button className="qty-btn" onClick={() => updateQty(i, 1)}>+</button>
                          <button className="remove-btn" onClick={() => removeFromCart(i)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-total">
                    <span className="cart-total-label">Subtotal</span>
                    <span className="cart-total-price">{fmt(cartTotal)}</span>
                  </div>
                  <div style={{ fontSize:"0.68rem", color:"var(--warm-gray)", textAlign:"center", margin:"-6px 0 12px", letterSpacing:"0.02em" }}>
                    VAT included where applicable (EU orders shown at checkout).
                  </div>
                  {!user && (
                    <div style={{ fontSize:"0.7rem", color:"var(--warm-gray)", marginBottom:12, textAlign:"center" }}>
                      <span onClick={() => { setCartOpen(false); setAuthMode("login"); setAuthOpen(true); }} style={{ cursor:"pointer", textDecoration:"underline", color:"var(--gold)" }}>Sign in</span> to save your bag
                    </div>
                  )}
                  <button
                    className="checkout-btn"
                    onClick={() => {
                      if (!user) {
                        setCartOpen(false);
                        setAuthMode("login");
                        setAuthOpen(true);
                        return;
                      }
                      setCartOpen(false);
                      setCheckoutStep(1);
                      setCheckoutOpen(true);
                    }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <>
          <div className="overlay-backdrop" onClick={closeCheckout} />
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <div className="modal-title">Checkout</div>
              <button className="close-btn" onClick={closeCheckout}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize:"0.72rem", color:"var(--warm-gray)", marginBottom:18, letterSpacing:"0.05em" }}>
                Step {checkoutStep} of 3
              </p>
              {checkoutStep === 1 && (
                <>
              <div className="form-row-two">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    className={`form-input${checkoutErrors.firstName ? " invalid" : ""}`}
                    value={checkoutDraft.firstName}
                    onChange={e => {
                      setCheckoutDraft({ ...checkoutDraft, firstName: e.target.value });
                      if (checkoutErrors.firstName) setCheckoutErrors({ ...checkoutErrors, firstName: false });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    className={`form-input${checkoutErrors.lastName ? " invalid" : ""}`}
                    value={checkoutDraft.lastName}
                    onChange={e => {
                      setCheckoutDraft({ ...checkoutDraft, lastName: e.target.value });
                      if (checkoutErrors.lastName) setCheckoutErrors({ ...checkoutErrors, lastName: false });
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  className={`form-input${checkoutErrors.email ? " invalid" : ""}`}
                  type="email"
                  value={checkoutDraft.email}
                  onChange={e => {
                    setCheckoutDraft({ ...checkoutDraft, email: e.target.value });
                    if (checkoutErrors.email) setCheckoutErrors({ ...checkoutErrors, email: false });
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Country / Region *</label>
                <select
                  className={`form-input${checkoutErrors.country ? " invalid" : ""}`}
                  value={checkoutDraft.country}
                  onChange={e => {
                    const selectedCountry = COUNTRY_OPTIONS.find(c => c.code === e.target.value) || COUNTRY_OPTIONS[0];
                    setCheckoutDraft({ ...checkoutDraft, country: selectedCountry.code, phoneCode: selectedCountry.dial });
                    if (checkoutErrors.country) setCheckoutErrors({ ...checkoutErrors, country: false });
                  }}
                >
                  <option value="">Default</option>
                  {COUNTRY_OPTIONS.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  className={`form-input${checkoutErrors.city ? " invalid" : ""}`}
                  value={checkoutDraft.city}
                  onChange={e => {
                    setCheckoutDraft({ ...checkoutDraft, city: e.target.value });
                    if (checkoutErrors.city) setCheckoutErrors({ ...checkoutErrors, city: false });
                  }}
                />
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input className="form-input" value={checkoutDraft.state} onChange={e => setCheckoutDraft({ ...checkoutDraft, state: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code *</label>
                  <input
                    className={`form-input${checkoutErrors.postalCode ? " invalid" : ""}`}
                    value={checkoutDraft.postalCode}
                    onChange={e => {
                      setCheckoutDraft({ ...checkoutDraft, postalCode: e.target.value });
                      if (checkoutErrors.postalCode) setCheckoutErrors({ ...checkoutErrors, postalCode: false });
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={checkoutDraft.address} onChange={e => setCheckoutDraft({ ...checkoutDraft, address: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="phone-wrap">
                  <span className="phone-code">{checkoutDraft.phoneCode}</span>
                  <input
                    className="form-input"
                    placeholder="Phone number"
                    value={checkoutDraft.phone}
                    onChange={e => setCheckoutDraft({ ...checkoutDraft, phone: e.target.value.replace(/[^\d\s-]/g, "") })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Option</label>
                <div style={{ display:"flex", gap:8 }}>
                  <button className={`filter-btn${checkoutDraft.deliveryType === "standard" ? " active" : ""}`} onClick={() => setCheckoutDraft({ ...checkoutDraft, deliveryType: "standard" })}>Standard ($8)</button>
                  <button className={`filter-btn${checkoutDraft.deliveryType === "express" ? " active" : ""}`} onClick={() => setCheckoutDraft({ ...checkoutDraft, deliveryType: "express" })}>Express ($20)</button>
                </div>
              </div>
              <button className="form-submit" onClick={handleConfirmAddress}>Confirm Delivery Address</button>
                </>
              )}

              {checkoutStep === 2 && (
                <>
              <div style={{ border:"1px solid var(--border)", padding:14, marginBottom:18, background:"var(--cream)" }}>
                <div style={{ fontFamily:"var(--font-serif)", fontSize:"1.05rem", marginBottom:10 }}>Bill Summary</div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", marginBottom:6 }}><span>Subtotal</span><span>{fmt(getPricing().subtotal)}</span></div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", marginBottom:6 }}><span>Product Discount</span><span>- {fmt(getPricing().itemDiscount)}</span></div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", marginBottom:6 }}><span>After Product Discount</span><span>{fmt(getPricing().discountedSubtotal)}</span></div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", marginBottom:6 }}><span>Promo Discount</span><span>- {fmt(getPricing().promoDiscount)}</span></div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", marginBottom:10 }}><span>Delivery Charge</span><span>{fmt(getPricing().shippingFee)}</span></div>
                <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid var(--border)", paddingTop:10, fontWeight:600 }}><span>Total</span><span>{fmt(getPricing().total)}</span></div>
                <div style={{ marginTop:8, fontSize:"0.7rem", color:"var(--warm-gray)", lineHeight:1.6 }}>
                  VAT included where applicable. Final VAT breakdown is shown for EU deliveries.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Promo Code (if any)</label>
                <input className="form-input" placeholder="Use SAVE10" value={promoCode} onChange={e => setPromoCode(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <div style={{ display:"flex", gap:8 }}>
                  <button className={`filter-btn${checkoutDraft.paymentMethod === "visa" ? " active" : ""}`} onClick={() => setCheckoutDraft({ ...checkoutDraft, paymentMethod: "visa" })}>Visa</button>
                  <button className={`filter-btn${checkoutDraft.paymentMethod === "mastercard" ? " active" : ""}`} onClick={() => setCheckoutDraft({ ...checkoutDraft, paymentMethod: "mastercard" })}>Mastercard</button>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:"0.75rem", cursor:"pointer", color:"var(--warm-gray)" }}>
                  <input
                    type="checkbox"
                    checked={checkoutDraft.markAsDue}
                    onChange={e => setCheckoutDraft({ ...checkoutDraft, markAsDue: e.target.checked })}
                    style={{ marginRight:8 }}
                  />
                  Save order as payment due
                </label>
              </div>

              {!checkoutDraft.markAsDue && (
                <>
                  <div className="form-group">
                    <label className="form-label">Card Holder</label>
                    <input className="form-input" value={checkoutDraft.cardHolder} onChange={e => setCheckoutDraft({ ...checkoutDraft, cardHolder: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input className="form-input" placeholder="4111 1111 1111 1111" value={checkoutDraft.cardNumber} onChange={e => setCheckoutDraft({ ...checkoutDraft, cardNumber: formatCardNumber(e.target.value) })} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div className="form-group">
                      <label className="form-label">Expiry</label>
                      <input className="form-input" maxLength={5} placeholder="MM/YY" value={checkoutDraft.expiry} onChange={e => setCheckoutDraft({ ...checkoutDraft, expiry: formatExpiry(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVV</label>
                      <input className="form-input" maxLength={4} placeholder="123" value={checkoutDraft.cvv} onChange={e => setCheckoutDraft({ ...checkoutDraft, cvv: e.target.value.replace(/\D/g, "") })} />
                    </div>
                  </div>
                </>
              )}
              <div style={{ display:"flex", gap:10 }}>
                <button className="filter-btn" onClick={() => setCheckoutStep(1)}>Back</button>
                <button className="form-submit" style={{ marginTop:0 }} onClick={handleConfirmPayment}>Confirm Payment</button>
              </div>
                </>
              )}

              {checkoutStep === 3 && (
                <>
                  <div style={{ background:"var(--cream)", border:"1px solid var(--border)", padding:14, marginBottom:14 }}>
                    <div style={{ fontFamily:"var(--font-serif)", fontSize:"1.05rem", marginBottom:8 }}>Customer Bill</div>
                    <div style={{ fontSize:"0.76rem", color:"var(--warm-gray)" }}>{checkoutDraft.firstName} {checkoutDraft.lastName}</div>
                    <div style={{ fontSize:"0.76rem", color:"var(--warm-gray)" }}>{checkoutDraft.email}</div>
                    <div style={{ fontSize:"0.76rem", color:"var(--warm-gray)" }}>{checkoutDraft.address}</div>
                    <div style={{ fontSize:"0.76rem", color:"var(--warm-gray)" }}>{checkoutDraft.city}{checkoutDraft.state ? `, ${checkoutDraft.state}` : ""}, {checkoutDraft.postalCode}</div>
                  </div>
                  <div style={{ border:"1px solid var(--border)", padding:14, marginBottom:14 }}>
                    {cart.map((item, idx) => {
                      const lineTotal = item.product.price * item.qty;
                      const lineDiscount = getProductDiscount(item);
                      return (
                        <div key={`${item.product.id}-${idx}`} style={{ borderBottom: idx < cart.length - 1 ? "1px solid var(--border)" : "none", paddingBottom:10, marginBottom:10 }}>
                          <div style={{ fontSize:"0.78rem" }}>{item.product.name} x {item.qty}</div>
                          <div style={{ fontSize:"0.72rem", color:"var(--warm-gray)" }}>Price: {fmt(lineTotal)}</div>
                          {lineDiscount > 0 && <div style={{ fontSize:"0.72rem", color:"var(--success)" }}>Discount: -{fmt(lineDiscount)}</div>}
                        </div>
                      );
                    })}
                    {getPricing().promoDiscount > 0 && <div style={{ fontSize:"0.74rem", color:"var(--success)" }}>Promo ({getPricing().normalizedPromo}): -{fmt(getPricing().promoDiscount)}</div>}
                    <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", fontWeight:600 }}><span>Grand Total</span><span>{fmt(getPricing().total)}</span></div>
                    <div style={{ marginTop:6, fontSize:"0.7rem", color:"var(--warm-gray)", lineHeight:1.6 }}>
                      VAT included where applicable. For EU orders, VAT is calculated based on delivery country.
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button className="filter-btn" onClick={() => setCheckoutStep(2)}>Back</button>
                    <button className="form-submit" style={{ marginTop:0 }} onClick={handlePlaceOrder}>Place Order</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mark Paid Confirmation Modal */}
      {payConfirmOrder && (
        <>
          <div className="overlay-backdrop" onClick={() => setPayConfirmOrder(null)} />
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">Confirm Payment</div>
              <button className="close-btn" onClick={() => setPayConfirmOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize:"0.72rem", color:"var(--warm-gray)", marginBottom:18, letterSpacing:"0.05em" }}>
                Please verify this order before marking payment as completed.
              </p>
              <div style={{ background:"var(--cream)", border:"1px solid var(--border)", padding:14, marginBottom:16 }}>
                <div style={{ fontFamily:"var(--font-serif)", fontSize:"1rem", marginBottom:8 }}>{payConfirmOrder.id}</div>
                <div style={{ fontSize:"0.72rem", color:"var(--warm-gray)", marginBottom:6 }}>
                  Amount: {fmt(payConfirmOrder.total)}
                </div>
                <div style={{ fontSize:"0.72rem", color:"var(--warm-gray)", marginBottom:6 }}>
                  Method: {payConfirmOrder.payment.method.toUpperCase()} {payConfirmOrder.payment.cardMasked ? `(${payConfirmOrder.payment.cardMasked})` : ""}
                </div>
                <div style={{ fontSize:"0.72rem", color:"var(--warm-gray)" }}>
                  Customer: {payConfirmOrder.delivery.fullName}
                </div>
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="filter-btn" onClick={() => setPayConfirmOrder(null)}>Cancel</button>
                <button className="btn-primary" style={{ padding:"10px 18px", fontSize:"0.65rem" }} onClick={handleConfirmMarkPaid}>
                  Confirm Paid
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Auth Modal */}
      {authOpen && (
        <>
          <div className="overlay-backdrop" onClick={() => setAuthOpen(false)} />
          <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} onSubmit={login} />
        </>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast${t.type === "success" ? " success" : ""}${t.removing ? " removing" : ""}`}>{t.msg}</div>
        ))}
      </div>

      <CookieNotice
        open={cookieOpen}
        onClose={() => setCookieOpen(false)}
        onSave={saveCookieConsent}
        existing={cookieConsent}
        navigate={navigate}
      />
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ navigate, products, addToCart, toggleWishlist, wishlist }) {
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
            ["Free shipping over $200","Sustainably crafted","Gift wrapping available","New arrivals weekly","Members save 15%"].map((t, j) => (
              <span key={`${i}-${j}`} className="marquee-item">{t} <span style={{ color:"rgba(201,169,110,0.4)" }}>◆</span></span>
            ))
          )}
        </div>
      </div>

      <section style={{ padding: 0 }}>
        <div className="categories-strip">
          {[
            { label: "Women", count: "48 pieces", cls: "cat-women", icon: "👗" },
            { label: "Men", count: "36 pieces", cls: "cat-men", icon: "🧥" },
            { label: "Kids", count: "18 pieces", cls: "cat-children", icon: "🧸" },
            { label: "Accessories", count: "24 pieces", cls: "cat-access", icon: "👜" },
          ].map(cat => (
            <div key={cat.label} className="category-card" onClick={() => navigate("shop")}>
              <div className={`category-bg ${cat.cls}`}><span className="cat-icon">{cat.icon}</span></div>
              <div className="category-overlay">
                <div className="cat-label">{cat.label}</div>
                <div className="cat-count">{cat.count}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ background:"white" }}>
        <div className="section-header animate-fade">
          <p className="section-eyebrow">Hand-Picked</p>
          <h2 className="section-title">Editor's <em>Picks</em></h2>
        </div>
        <div className="products-grid">
          {products.filter(p => p.badge).map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i} navigate={navigate} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlisted={wishlist.includes(p.id)} />
          ))}
        </div>
      </section>

      <section style={{ background:"var(--charcoal)", padding:"80px 40px", textAlign:"center" }}>
        <p style={{ fontSize:"0.68rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"var(--gold)", marginBottom:16 }}>Members Club</p>
        <h2 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.8rem,4vw,3rem)", color:"var(--cream)", fontWeight:300, marginBottom:16 }}>Join for <em>Exclusive</em> Benefits</h2>
        <p style={{ fontSize:"0.8rem", color:"rgba(250,247,242,0.55)", maxWidth:480, margin:"0 auto 36px", lineHeight:1.8 }}>
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
            <ProductCard key={p.id} product={p} delay={i} navigate={navigate} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlisted={wishlist.includes(p.id)} />
          ))}
        </div>
        <div style={{ textAlign:"center", marginTop:48 }}>
          <button className="btn-primary" onClick={() => navigate("shop")}>View All Pieces</button>
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, delay, navigate, addToCart, toggleWishlist, wishlisted }) {
  return (
    <div className={`product-card animate-fade-d${Math.min(delay + 1, 4)}`}>
      {product.badge && <div className="product-badge">{product.badge}</div>}
      <button className={`wishlist-btn${wishlisted ? " active" : ""}`} onClick={e => { e.stopPropagation(); toggleWishlist(product.id); }}>
        {wishlisted ? "♥" : "♡"}
      </button>
      <div className="product-img" style={{ background:`linear-gradient(135deg,${product.bg[0]},${product.bg[1]})` }} onClick={() => navigate("product", product)}>
        <span className="product-emoji">{product.emoji}</span>
        <div className="product-actions-overlay">
          <button className="overlay-btn overlay-btn-primary" onClick={e => { e.stopPropagation(); addToCart(product, product.sizes[0]); }}>Add to Bag</button>
          <button className="overlay-btn overlay-btn-outline" onClick={e => { e.stopPropagation(); navigate("product", product); }}>View</button>
        </div>
      </div>
      <div className="product-info" onClick={() => navigate("product", product)}>
        <div className="product-brand">{product.brand}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-price">{fmt(product.price)}</div>
      </div>
    </div>
  );
}

// ─── Shop Page ────────────────────────────────────────────────────────────────
function ShopPage({ products, navigate, filter, setFilter, sort, setSort, addToCart, toggleWishlist, wishlist }) {
  let filtered = filter === "All" ? products : products.filter(p => p.category === filter);
  if (sort === "price-asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === "new") filtered = [...filtered].filter(p => p.badge === "New").concat(filtered.filter(p => p.badge !== "New"));

  return (
    <div className="shop-layout">
      <div className="shop-header animate-fade">
        <div>
          <h1 className="shop-title">The Collection</h1>
          <p style={{ fontSize:"0.72rem", color:"var(--warm-gray)", marginTop:4 }}>{filtered.length} pieces</p>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
          <div className="filter-bar">
            {["All","Women","Men","Kids","Accessories"].map(c => (
              <button key={c} className={`filter-btn${filter === c ? " active" : ""}`} onClick={() => setFilter(c)}>{c}</button>
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
      <div className="products-grid">
        {filtered.map((p, i) => (
          <ProductCard key={p.id} product={p} delay={i % 4} navigate={navigate} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlisted={wishlist.includes(p.id)} />
        ))}
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

// ─── Product Detail ───────────────────────────────────────────────────────────
function ProductDetailPage({ product, navigate, addToCart, toggleWishlist, wishlist }) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const wishlisted = wishlist.includes(product.id);
  return (
    <div>
      <div className="product-detail">
        <div className="animate-scale">
          <div className="detail-img" style={{ background:`linear-gradient(135deg,${product.bg[0]},${product.bg[1]})` }}>
            <span style={{ fontSize:"9rem" }}>{product.emoji}</span>
          </div>
        </div>
        <div className="animate-fade">
          <button onClick={() => navigate("shop")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.68rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--warm-gray)", marginBottom:24, display:"flex", alignItems:"center", gap:6 }}>
            ← Back to Collection
          </button>
          {product.badge && <div style={{ display:"inline-block", background:"var(--charcoal)", color:"white", fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", padding:"4px 10px", marginBottom:16 }}>{product.badge}</div>}
          <div className="detail-brand">{product.brand}</div>
          <h1 className="detail-name">{product.name}</h1>
          <div className="detail-price">{fmt(product.price)}</div>
          <p className="detail-desc">{product.desc}</p>
          <p style={{ fontSize:"0.65rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--warm-gray)", marginBottom:10 }}>Select Size</p>
          <div className="size-grid">
            {product.sizes.map(s => (
              <button key={s} className={`size-btn${selectedSize === s ? " selected" : ""}`} onClick={() => setSelectedSize(s)}>{s}</button>
            ))}
          </div>
          <div className="detail-actions">
            <button className="add-cart-btn" onClick={() => addToCart(product, selectedSize)}>Add to Bag</button>
            <button className={`wish-btn${wishlisted ? " active" : ""}`} onClick={() => toggleWishlist(product.id)}>{wishlisted ? "♥" : "♡"}</button>
          </div>
          <div style={{ marginTop:28, paddingTop:28, borderTop:"1px solid var(--border)" }}>
            {[["🚚","Free Express Delivery","On orders over $200"],["↩️","Easy Returns","30-day free returns"],["✦","Authenticity Guaranteed","100% genuine products"]].map(([icon,title,sub]) => (
              <div key={title} style={{ display:"flex", gap:14, marginBottom:14, alignItems:"center" }}>
                <span style={{ fontSize:"1.2rem" }}>{icon}</span>
                <div>
                  <div style={{ fontSize:"0.72rem", fontWeight:600 }}>{title}</div>
                  <div style={{ fontSize:"0.68rem", color:"var(--warm-gray)" }}>{sub}</div>
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

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ user, cart, wishlist, products, logout, tab, setTab, navigate, onMarkOrderPaid, onUpdateProfile }) {
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const normalizedUser = normalizeUser(user);
  const [settingsDraft, setSettingsDraft] = useState(() => ({
    firstName: normalizedUser?.firstName || "",
    lastName: normalizedUser?.lastName || "",
    email: normalizedUser?.email || "",
    country: normalizedUser?.profile?.country || "",
    city: normalizedUser?.profile?.city || "",
    address: normalizedUser?.profile?.address || "",
    postalCode: normalizedUser?.profile?.postalCode || "",
  }));

  useEffect(() => {
    const u = normalizeUser(user);
    setSettingsDraft({
      firstName: u?.firstName || "",
      lastName: u?.lastName || "",
      email: u?.email || "",
      country: u?.profile?.country || "",
      city: u?.profile?.city || "",
      address: u?.profile?.address || "",
      postalCode: u?.profile?.postalCode || "",
    });
  }, [user]);
  if (!user) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:20, paddingTop:64 }}>
      <p style={{ fontFamily:"var(--font-serif)", fontSize:"1.5rem" }}>Please sign in to view your profile</p>
      <button className="btn-primary" onClick={() => navigate("home")}>Go Home</button>
    </div>
  );
  const wishlistProducts = products.filter(p => wishlist.includes(p.id));
  return (
    <div className="profile-layout">
      <div className="profile-header animate-fade">
        <div className="avatar">{(normalizedUser.name || "U")[0].toUpperCase()}</div>
        <div>
          <div className="profile-name">{normalizedUser.name}</div>
          <div className="profile-email">{normalizedUser.email}</div>
          <div style={{ marginTop:8, fontSize:"0.65rem", color:"var(--gold)", letterSpacing:"0.15em", textTransform:"uppercase" }}>✦ Member</div>
        </div>
        <button onClick={logout} style={{ marginLeft:"auto", background:"none", border:"1px solid var(--border)", cursor:"pointer", padding:"8px 20px", fontSize:"0.65rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--warm-gray)", transition:"all 0.2s" }}
          onMouseOver={e => { e.currentTarget.style.background="var(--charcoal)"; e.currentTarget.style.color="white"; }}
          onMouseOut={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="var(--warm-gray)"; }}>
          Sign Out
        </button>
      </div>
      <div className="profile-tabs">
        {[["orders","Orders"],["cart","Saved Bag"],["wishlist","Wishlist"],["settings","Settings"]].map(([id,label]) => (
          <button key={id} className={`profile-tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="animate-fade-d1">
        {tab === "orders" && (
          <div>
            {(user.orders || []).length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--warm-gray)" }}>
                <div style={{ fontSize:"3rem", marginBottom:16 }}>📦</div>
                <p style={{ fontFamily:"var(--font-serif)", fontSize:"1.2rem", marginBottom:8, color:"var(--charcoal)" }}>No orders yet</p>
                <p style={{ fontSize:"0.75rem", marginBottom:24 }}>Your orders will appear here.</p>
                <button className="btn-primary" onClick={() => navigate("shop")}>Start Shopping</button>
              </div>
            ) : (
              <div style={{ display:"grid", gap:14 }}>
                {user.orders.map((o) => (
                  <div key={o.id} style={{ background:"white", padding:16, border:"1px solid var(--border)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, gap:8, flexWrap:"wrap" }}>
                      <div style={{ fontFamily:"var(--font-serif)", fontSize:"1rem" }}>{o.id}</div>
                      <span
                        style={{
                          fontSize:"0.65rem",
                          letterSpacing:"0.12em",
                          textTransform:"uppercase",
                          padding:"4px 10px",
                          background: o.payment.status === "completed" ? "rgba(39,174,96,.12)" : "rgba(192,57,43,.12)",
                          color: o.payment.status === "completed" ? "var(--success)" : "var(--error)",
                          fontWeight: 700,
                        }}
                      >
                        {o.payment.status === "completed" ? "Payment Completed" : "Payment Due"}
                      </span>
                    </div>
                    <div style={{ fontSize:"0.72rem", color:"var(--warm-gray)", marginBottom:6 }}>
                      {new Date(o.createdAt).toLocaleString()} · {o.delivery.type === "express" ? "Express" : "Standard"} delivery
                    </div>
                    <div style={{ fontSize:"0.72rem", color:"var(--warm-gray)", marginBottom:6 }}>
                      Method: {o.payment.method.toUpperCase()} {o.payment.cardMasked ? `(${o.payment.cardMasked})` : ""}
                    </div>
                    {o.payment.transactionId && (
                      <div style={{ fontSize:"0.7rem", color:"var(--warm-gray)", marginBottom:6 }}>
                        Transaction: {o.payment.transactionId}
                      </div>
                    )}
                    {o.payment.paidAt && (
                      <div style={{ fontSize:"0.7rem", color:"var(--warm-gray)", marginBottom:6 }}>
                        Paid At: {new Date(o.payment.paidAt).toLocaleString()}
                      </div>
                    )}
                    <div style={{ fontSize:"0.78rem", fontWeight:600, color:"var(--charcoal)" }}>
                      Total: {fmt(o.total)}
                    </div>
                    <div style={{ fontSize:"0.7rem", color:"var(--warm-gray)", marginTop:8, marginBottom:10 }}>
                      {o.items.length} item{o.items.length !== 1 ? "s" : ""} · {o.delivery.fullName}, {o.delivery.city}
                    </div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <button className="filter-btn" onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}>
                        {expandedOrderId === o.id ? "Hide Items" : "View Items"}
                      </button>
                      {o.payment.status === "due" && (
                        <button className="btn-primary" style={{ padding:"8px 14px", fontSize:"0.62rem" }} onClick={() => onMarkOrderPaid(o)}>
                          Mark as Paid
                        </button>
                      )}
                    </div>
                    {expandedOrderId === o.id && (
                      <div style={{ marginTop:12, borderTop:"1px solid var(--border)", paddingTop:12, display:"grid", gap:8 }}>
                        {o.items.map((item, idx) => (
                          <div key={`${o.id}-${idx}`} style={{ display:"flex", justifyContent:"space-between", gap:12, fontSize:"0.74rem" }}>
                            <span style={{ color:"var(--warm-gray)" }}>{item.product.name} · Size {item.size} · Qty {item.qty}</span>
                            <span style={{ fontWeight:600 }}>{fmt(item.product.price * item.qty)}</span>
                          </div>
                        ))}
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", color:"var(--warm-gray)", marginTop:4 }}>
                          <span>Subtotal</span>
                          <span>{fmt(o.subtotal)}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", color:"var(--warm-gray)" }}>
                          <span>Shipping</span>
                          <span>{fmt(o.shippingFee)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "cart" && (
          <div>
            <p style={{ fontSize:"0.72rem", color:"var(--warm-gray)", marginBottom:24, letterSpacing:"0.1em" }}>{cart.length} item{cart.length !== 1 ? "s" : ""} · Synced to your account</p>
            {cart.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:"3rem", marginBottom:16 }}>🛍</div>
                <button className="btn-primary" style={{ marginTop:20 }} onClick={() => navigate("shop")}>Shop Now</button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:20 }}>
                {cart.map((item, i) => (
                  <div key={i} style={{ background:"white", padding:16, cursor:"pointer" }} onClick={() => navigate("product", item.product)}>
                    <div style={{ background:`linear-gradient(135deg,${item.product.bg[0]},${item.product.bg[1]})`, height:140, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3.5rem", marginBottom:12 }}>{item.product.emoji}</div>
                    <div style={{ fontFamily:"var(--font-serif)", fontSize:"0.95rem", marginBottom:4 }}>{item.product.name}</div>
                    <div style={{ fontSize:"0.68rem", color:"var(--warm-gray)", marginBottom:4 }}>Size {item.size} · Qty {item.qty}</div>
                    <div style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--gold)" }}>{fmt(item.product.price * item.qty)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "wishlist" && (
          <div>
            <p style={{ fontSize:"0.72rem", color:"var(--warm-gray)", marginBottom:24 }}>{wishlistProducts.length} saved item{wishlistProducts.length !== 1 ? "s" : ""}</p>
            {wishlistProducts.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:"3rem", marginBottom:16 }}>♡</div>
                <button className="btn-primary" style={{ marginTop:20 }} onClick={() => navigate("shop")}>Explore Collection</button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:20 }}>
                {wishlistProducts.map(p => (
                  <div key={p.id} style={{ background:"white", padding:16, cursor:"pointer" }} onClick={() => navigate("product", p)}>
                    <div style={{ background:`linear-gradient(135deg,${p.bg[0]},${p.bg[1]})`, height:140, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3.5rem", marginBottom:12 }}>{p.emoji}</div>
                    <div style={{ fontFamily:"var(--font-serif)", fontSize:"0.95rem", marginBottom:4 }}>{p.name}</div>
                    <div style={{ fontSize:"0.68rem", color:"var(--warm-gray)", marginBottom:4 }}>{p.brand}</div>
                    <div style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--gold)" }}>{fmt(p.price)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "settings" && (
          <div style={{ maxWidth:480 }}>
            <h3 style={{ fontFamily:"var(--font-serif)", fontSize:"1.2rem", marginBottom:20 }}>Account Details</h3>
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <button className="filter-btn" onClick={() => { setEditingSettings(!editingSettings); }}>
                {editingSettings ? "Cancel" : "Edit"}
              </button>
              {editingSettings && (
                <button
                  className="btn-primary"
                  style={{ padding:"8px 14px", fontSize:"0.62rem" }}
                  onClick={() => {
                    const nextFirst = settingsDraft.firstName.trim();
                    const nextLast = settingsDraft.lastName.trim();
                    if (!nextFirst) return;
                    onUpdateProfile?.({
                      firstName: nextFirst,
                      lastName: nextLast,
                      profile: {
                        country: settingsDraft.country || "",
                        city: settingsDraft.city || "",
                        address: settingsDraft.address || "",
                        postalCode: settingsDraft.postalCode || "",
                      },
                    });
                    setEditingSettings(false);
                  }}
                >
                  Save Changes
                </button>
              )}
            </div>

            {!editingSettings ? (
              <div style={{ display:"grid", gap:12 }}>
                {[
                  ["First Name", normalizedUser.firstName || ""],
                  ["Last Name", normalizedUser.lastName || ""],
                  ["Email", normalizedUser.email || ""],
                  ["Country / Region", normalizedUser.profile?.country || "—"],
                  ["City", normalizedUser.profile?.city || "—"],
                  ["Address", normalizedUser.profile?.address || "—"],
                  ["Postal Code", normalizedUser.profile?.postalCode || "—"],
                  ["Member Since", "2026"],
                ].map(([label,value]) => (
                  <div key={label} style={{ padding:"14px 16px", background:"white", display:"flex", justifyContent:"space-between", gap:10 }}>
                    <span style={{ fontSize:"0.68rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--warm-gray)" }}>{label}</span>
                    <span style={{ fontSize:"0.82rem", fontWeight:500, textAlign:"right" }}>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display:"grid", gap:12, background:"white", padding:16, border:"1px solid var(--border)" }}>
                <div className="form-row-two">
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">First Name *</label>
                    <input className="form-input" value={settingsDraft.firstName} onChange={(e) => setSettingsDraft({ ...settingsDraft, firstName: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">Last Name</label>
                    <input className="form-input" value={settingsDraft.lastName} onChange={(e) => setSettingsDraft({ ...settingsDraft, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Email</label>
                  <input className="form-input" value={settingsDraft.email} disabled />
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Country / Region (optional)</label>
                  <select className="form-input" value={settingsDraft.country} onChange={(e) => setSettingsDraft({ ...settingsDraft, country: e.target.value })}>
                    <option value="">—</option>
                    {COUNTRY_OPTIONS.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row-two">
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">City (optional)</label>
                    <input className="form-input" value={settingsDraft.city} onChange={(e) => setSettingsDraft({ ...settingsDraft, city: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">Postal Code (optional)</label>
                    <input className="form-input" value={settingsDraft.postalCode} onChange={(e) => setSettingsDraft({ ...settingsDraft, postalCode: e.target.value })} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Address (optional)</label>
                  <input className="form-input" value={settingsDraft.address} onChange={(e) => setSettingsDraft({ ...settingsDraft, address: e.target.value })} />
                </div>
              </div>
            )}
            <div style={{ marginTop:24, padding:20, background:"var(--charcoal)", color:"white" }}>
              <p style={{ fontSize:"0.65rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--gold)", marginBottom:8 }}>✦ Active Member</p>
              <p style={{ fontFamily:"var(--font-serif)", fontSize:"1.1rem" }}>You're enjoying all member benefits</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── About Page ───────────────────────────────────────────────────────────────
function AboutPage({ navigate }) {
  return (
    <div>
      <div style={{ background:"var(--charcoal)", padding:"120px 40px 80px", textAlign:"center" }}>
        <p style={{ fontSize:"0.7rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"var(--gold)", marginBottom:20 }}>Est. 2018</p>
        <h1 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(2.5rem,6vw,5rem)", color:"var(--cream)", fontWeight:300, lineHeight:1.1 }}>Fashion with<br /><em style={{ color:"var(--gold-light)" }}>Purpose</em></h1>
      </div>
      <div style={{ maxWidth:780, margin:"0 auto", padding:"80px 40px" }}>
        {[["Our Story","sanjiiiii was born from a simple belief: that luxury and sustainability are not mutually exclusive. Founded in Paris in 2018, we source only from artisans who share our commitment to ethical production and enduring quality."],
          ["Our Philosophy","We reject the notion of fast fashion. Every piece in our collection is designed to be worn for decades, not seasons. We work with heritage mills and independent craftspeople to ensure each garment tells a story of skilled hands and considered materials."],
          ["Sustainability","We are committed to reducing our environmental footprint at every step. From our organic and recycled materials to our carbon-neutral shipping, every decision is made with the planet in mind."]].map(([title,body],i) => (
          <div key={title} style={{ marginBottom:56, paddingBottom:56, borderBottom:i < 2 ? "1px solid var(--border)" : "none" }}>
            <h2 style={{ fontFamily:"var(--font-serif)", fontSize:"1.8rem", fontWeight:400, marginBottom:16 }}>{title}</h2>
            <p style={{ fontSize:"0.88rem", lineHeight:1.9, color:"var(--warm-gray)" }}>{body}</p>
          </div>
        ))}
        <div style={{ textAlign:"center" }}>
          <button className="btn-primary" onClick={() => navigate("shop")}>Shop the Collection</button>
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ mode, setMode, onClose, onSubmit }) {
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const pwChecks = getPasswordChecks(form.password);
  const pwAllOk = pwChecks.length && pwChecks.upper && pwChecks.lower && pwChecks.number && pwChecks.symbol;

  const handle = () => {
    if (!form.email || !form.password) { setError("Please fill all fields."); return; }
    if (mode === "register" && !form.firstName) { setError("Please enter your first name."); return; }
    if (mode === "register" && !form.lastName) { setError("Please enter your last name."); return; }
    if (mode === "register" && !isStrongPassword(form.password)) {
      setError("Password must be 8+ chars with uppercase, lowercase, number, and a symbol.");
      return;
    }
    setLoading(true); setError("");
    const err = onSubmit(form);
    if (err) { setError(err); setLoading(false); }
  };

  return (
    <div className="modal">
      <div className="modal-header">
        <div className="modal-title" style={{ fontWeight: 600 }}>
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <p style={{ fontSize:"0.72rem", color:"var(--warm-gray)", marginBottom:24, letterSpacing:"0.05em" }}>
          {mode === "login" ? "Sign in to access your saved bag and wishlist." : "Join for exclusive benefits and seamless shopping."}
        </p>
        {mode === "register" && (
          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position:"relative" }}>
            <input
              className="form-input"
              type={showPass ? "text" : "password"}
              name="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handle()}
              style={{ paddingRight:44 }}
            />
  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--warm-gray)", fontSize:"1.1rem" }}>
    {showPass ? "🙈" : "👁"}
  </button>
</div>
          {mode === "register" && (
            <div style={{ marginTop:8 }}>
              <div style={{ display:"grid", gap:6, fontSize:"0.7rem", lineHeight:1.4 }}>
                {[
                  ["8+ characters", pwChecks.length],
                  ["Uppercase letter (A-Z)", pwChecks.upper],
                  ["Lowercase letter (a-z)", pwChecks.lower],
                  ["A number (0-9)", pwChecks.number],
                  ["A symbol (!@#$...)", pwChecks.symbol],
                ].map(([label, ok]) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:8, color: ok ? "var(--success)" : "var(--error)" }}>
                    <span style={{ fontWeight: 900 }}>{ok ? "✓" : "•"}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mode === "login" && (
            <div style={{ marginTop:10, textAlign:"right" }}>
              <button
                type="button"
                onClick={() => setError("Forgot password isn’t available in this demo yet. Please create a new account or contact support.")}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--gold)", fontWeight:600, fontSize:"0.72rem", textDecoration:"underline" }}
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>
        {error && <div className="form-error">{error}</div>}
        <button className="form-submit" onClick={handle} disabled={loading || (mode === "register" && !pwAllOk)}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div className="auth-divider">or</div>

        <div className="social-login-grid">
          <button className="btn-social" onClick={() => addToast("Google login is coming soon!", "info")}>
            <span className="social-icon">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </span>
            Continue with Google
          </button>
          <button className="btn-social" onClick={() => addToast("Apple login is coming soon!", "info")}>
            <span className="social-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M17.05 20.28c-.96.95-2.04 1.9-3.32 1.9-1.25 0-1.74-.78-3.19-.78-1.47 0-1.99.76-3.21.78-1.28.02-2.48-1.04-3.44-2.02-1.97-2.01-3.48-5.69-1.46-8.79 1-1.54 2.82-2.52 4.41-2.55 1.2-.02 2.33.72 3.07.72s1.9-.76 3.32-.62c.59.03 2.26.22 3.33 1.65-.09.05-1.99 1.05-1.97 3.34.02 2.76 2.65 3.73 2.7 3.75-.02.08-.43 1.34-1.24 2.61zM12.03 7.25c-.02-2.24 1.83-4.14 4.02-4.25.02.22.04.44.04.67 0 2.12-1.89 4.19-4.06 3.58z"/>
              </svg>
            </span>
            Continue with Apple
          </button>
        </div>
        <div className="auth-switch">
          {mode === "login"
            ? <>New to sanjiiiii? <button onClick={() => { setMode("register"); setError(""); }}>Create an account</button></>
            : <>Already a member? <button onClick={() => { setMode("login"); setError(""); }}>Sign in</button></>}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">sanj<span>iiiii</span></div>
          <p className="footer-desc">Luxury fashion curated for the modern connoisseur. Sustainable, ethical, timeless.</p>
        </div>
        <div>
          <div className="footer-col-title">Shop</div>
          {["Women","Men","Kids","Accessories","New Arrivals","Sale"].map(l => <span key={l} className="footer-link" onClick={() => navigate("shop")}>{l}</span>)}
        </div>
        <div>
          <div className="footer-col-title">Help</div>
          {["Shipping & Returns","Size Guide","FAQ","Contact Us","Stores"].map(l => <span key={l} className="footer-link">{l}</span>)}
          <span className="footer-link" onClick={() => navigate("privacy")}>Privacy Policy</span>
          <span className="footer-link" onClick={() => navigate("terms")}>Terms</span>
          <span className="footer-link" onClick={() => window.dispatchEvent(new Event("velours:cookie-settings"))}>
            Cookie Settings
          </span>
        </div>
        <div>
          <div className="footer-col-title">Company</div>
          {["Our Story","Sustainability","Careers","Press"].map(l => <span key={l} className="footer-link" onClick={() => navigate("about")}>{l}</span>)}
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">© 2026 sanjiiiii. All rights reserved.</span>
        <div className="footer-socials">
          {["𝕏","in","ig","fb"].map(s => <div key={s} className="social-btn">{s}</div>)}
        </div>
      </div>
    </footer>
  );
}

function CookieNotice({ open, onClose, onSave, existing, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(Boolean(existing?.analytics));
  const [marketing, setMarketing] = useState(Boolean(existing?.marketing));

  useEffect(() => {
    if (!open) return;
    setExpanded(false);
    setAnalytics(Boolean(existing?.analytics));
    setMarketing(Boolean(existing?.marketing));
  }, [open, existing]);

  if (!open) return null;

  const acceptAll = () => onSave({ necessary: true, analytics: true, marketing: true });
  const rejectAll = () => onSave({ necessary: true, analytics: false, marketing: false });
  const saveCustom = () => onSave({ necessary: true, analytics, marketing });

  return (
    <>
      {/* Cookie bar doesn't block the page (like CookieYes). Backdrop only when customizing. */}
      {expanded && <div className="cookie-backdrop" onClick={onClose} />}
      <div className="cookie-panel" role="dialog" aria-modal="true" aria-label="Cookie preferences">
        <div className="cookie-top">
          <div className="cookie-badge" aria-hidden="true">
            <img
              src="/cookie.png"
              alt=""
              style={{ width: 28, height: 28, display: "block", objectFit: "contain" }}
              draggable="false"
            />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="cookie-title">Your privacy, your choice</div>
            <div className="cookie-text">
              We use cookies to keep the site secure, improve performance, and personalize experiences. You can change
              your preferences anytime in our{" "}
              <a onClick={() => { onClose(); navigate("privacy"); }}>Privacy Policy</a>.
            </div>
          </div>
          <button className="cookie-close" onClick={onClose} aria-label="Close cookie notice">✕</button>
        </div>

        {!expanded ? (
          <div className="cookie-actions">
            <button className="cookie-btn ghost" onClick={() => setExpanded(true)}>Customize</button>
            <button className="cookie-btn dark" onClick={rejectAll}>Reject non‑essential</button>
            <button className="cookie-btn primary" onClick={acceptAll}>Accept all</button>
          </div>
        ) : (
          <>
            <div className="cookie-drawer">
              <div className="cookie-row">
                <div>
                  <strong>Necessary</strong>
                  <div><span>Required for security and core features.</span></div>
                </div>
                <div className="cookie-toggle">
                  <div className="cookie-lock">Always on</div>
                </div>
              </div>
              <div className="cookie-row">
                <div>
                  <strong>Analytics</strong>
                  <div><span>Helps us understand what works and what doesn’t.</span></div>
                </div>
                <div className="cookie-toggle">
                  <div className={`cookie-switch${analytics ? " on" : ""}`} onClick={() => setAnalytics(v => !v)} role="switch" aria-checked={analytics} />
                </div>
              </div>
              <div className="cookie-row">
                <div>
                  <strong>Marketing</strong>
                  <div><span>Used to show relevant offers across channels.</span></div>
                </div>
                <div className="cookie-toggle">
                  <div className={`cookie-switch${marketing ? " on" : ""}`} onClick={() => setMarketing(v => !v)} role="switch" aria-checked={marketing} />
                </div>
              </div>
            </div>
            <div className="cookie-actions">
              <button className="cookie-btn ghost" onClick={() => setExpanded(false)}>Back</button>
              <button className="cookie-btn dark" onClick={rejectAll}>Reject non‑essential</button>
              <button className="cookie-btn primary" onClick={saveCustom}>Save preferences</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function PrivacyPage({ navigate }) {
  return (
    <div className="legal-page">
      <button onClick={() => navigate("home")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.68rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--warm-gray)", marginBottom:24, display:"flex", alignItems:"center", gap:6 }}>
        ← Back to Home
      </button>
      <div className="legal-card">
        <div className="legal-kicker">Privacy</div>
        <div className="legal-h1">Privacy Policy</div>
        <p className="legal-p">
          This is a demo storefront. We minimize personal data usage and store account/cart information locally in your browser.
          If you sign in, your profile and orders are saved to localStorage on this device.
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

function TermsPage({ navigate }) {
  return (
    <div className="legal-page">
      <button onClick={() => navigate("home")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.68rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--warm-gray)", marginBottom:24, display:"flex", alignItems:"center", gap:6 }}>
        ← Back to Home
      </button>
      <div className="legal-card">
        <div className="legal-kicker">Legal</div>
        <div className="legal-h1">Terms & Conditions</div>
        <p className="legal-p">
          This is a demo project. No real payments are processed and products are illustrative only.
        </p>
        <ul style={{ paddingLeft: 18 }}>
          <li className="legal-li"><strong>Orders</strong>: created for demonstration purposes; saved locally on your device.</li>
          <li className="legal-li"><strong>Pricing</strong>: displayed in USD; VAT included where applicable and shown for EU deliveries at checkout.</li>
          <li className="legal-li"><strong>Returns</strong>: policies shown are sample terms.</li>
        </ul>
        <div className="legal-note">
          If you are testing as a European client, make sure cookie consent is captured and the VAT disclosure is visible at checkout.
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}
