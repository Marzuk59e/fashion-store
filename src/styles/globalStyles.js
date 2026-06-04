const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #FAF7F2;
    --charcoal: #1A1A1A;
    --gold: #C9A96E;
    --gold-light: #E8D5B0;
    --warm-gray: #4F4841;
    --border: #E8E2D9;
    --white: #FFFFFF;
    --surface: #FFFFFF;
    --nav-bg: rgba(250,247,242,0.96);
    --nav-height: 52px;
    --nav-edge-space: clamp(20px, 4vw, 40px);
    --nav-offset: calc(var(--nav-height) + env(safe-area-inset-top, 0px));
    --hero-bg: #1A1A1A;
    --error: #C0392B;
    --success: #27AE60;
    --font-serif: 'Cormorant Garamond', Georgia, serif;
    --font-sans: 'Montserrat', sans-serif;
  }
  body { background: var(--cream); color: var(--charcoal); font-family: var(--font-sans); font-weight: 500; line-height: 1.5; }
  input, select, textarea, button { font-family: var(--font-sans); }

  /* Readability boost on white/cream backgrounds */
  .nav-link,
  .product-brand,
  .cart-item-meta,
  .cart-total-label,
  .form-label,
  .form-error,
  .auth-switch,
  .pay-method-card-sub,
  .pay-detail-hint,
  .receipt-label,
  .receipt-line-muted,
  .receipt-footer,
  .profile-email,
  .shop-search-sug-meta,
  .shop-search-empty,
  .filter-btn {
    color: var(--warm-gray);
    font-weight: 500;
  }
  .nav-link { font-size: 0.78rem; }
  .product-brand { font-size: 0.68rem; }
  .cart-item-meta { font-size: 0.74rem; }
  .cart-total-label { font-size: 0.74rem; }
  .form-label { font-size: 0.7rem; }
  .form-input { font-size: 0.9rem; color: var(--charcoal); }
  .pay-method-card-sub { font-size: 0.72rem; }
  .pay-detail-hint { font-size: 0.78rem; }
  .receipt-label { font-size: 0.64rem; }
  .receipt-line { font-size: 0.8rem; color: #221e1a; }
  .receipt-line-muted { font-size: 0.76rem; }
  .receipt-footer { font-size: 0.68rem; }
  .shop-search-sug-meta { font-size: 0.66rem; }
  .filter-btn { font-size: 0.7rem; }
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
    background: var(--nav-bg); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: nowrap;
    gap: 16px;
    padding-left: max(var(--nav-edge-space), env(safe-area-inset-left, 0px));
    padding-right: max(var(--nav-edge-space), env(safe-area-inset-right, 0px));
    padding-bottom: 0;
    padding-top: env(safe-area-inset-top, 0px);
    min-height: var(--nav-offset);
    height: var(--nav-offset);
    box-sizing: border-box;
    transition: box-shadow 0.3s;
  }
  @media (max-width: 768px) {
    .navbar { backdrop-filter: none; background: var(--cream); }
  }
  .nav-menu-btn {
    display: none !important;
    width: 0; height: 0; padding: 0; margin: 0;
    overflow: hidden; opacity: 0; pointer-events: none; border: none;
  }
  .navbar.scrolled { box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .nav-logo {
    flex-shrink: 0;
    font-family: var(--font-serif); font-size: 1.35rem; font-weight: 600;
    letter-spacing: 0.03em; color: var(--charcoal); cursor: pointer;
    text-transform: lowercase; background: none; border: none; line-height: 1;
    white-space: nowrap;
  }
  .logo-accent {
    color: var(--gold);
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 1em;
    letter-spacing: 0.05em;
  }
  .nav-links { display: flex; gap: 32px; align-items: center; }
  .nav-links--desktop {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
  }
  .nav-links--desktop .nav-link { pointer-events: auto; }
  .nav-link { font-size: 0.78rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--warm-gray); cursor: pointer; transition: color 0.2s; border: none; background: none; }
  .nav-link:hover, .nav-link.active { color: var(--charcoal); }
  .nav-icons { display: flex; gap: 10px; align-items: center; margin-left: auto; flex-shrink: 0; }
  .nav-icons .btn-primary { padding: 10px 20px; font-size: 0.7rem; }
  .icon-btn { background: none; border: none; cursor: pointer; position: relative; color: var(--charcoal); padding: 4px; transition: color 0.2s; display: flex; align-items: center; }
  .icon-btn:hover { color: var(--gold); }
  .nav-icons svg { width: 18px; height: 18px; }
  .icon-btn--notification svg { width: 20px; height: 20px; stroke-width: 2.1; }
  .badge { position: absolute; top: -4px; right: -6px; background: var(--gold); color: white; border-radius: 50%; width: 16px; height: 16px; font-size: 0.6rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .bell-dot {
    position: absolute;
    top: 2px;
    right: 1px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #e33a4a;
    box-shadow: 0 0 0 0 rgba(227,58,74,0.5);
    animation: bellPulse 1.6s infinite;
  }
  @keyframes bellPulse {
    0% { box-shadow: 0 0 0 0 rgba(227,58,74,0.5); }
    70% { box-shadow: 0 0 0 7px rgba(227,58,74,0); }
    100% { box-shadow: 0 0 0 0 rgba(227,58,74,0); }
  }

  .hero { height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background: var(--hero-bg); }
  .hero-bg { position: absolute; inset: 0; background: linear-gradient(135deg, var(--hero-bg) 0%, #2C2416 40%, var(--hero-bg) 100%); }
  .hero-pattern { position: absolute; inset: 0; opacity: 0.04; background-image: repeating-linear-gradient(45deg, var(--gold) 0, var(--gold) 1px, transparent 0, transparent 50%); background-size: 20px 20px; }
  .hero-content { position: relative; z-index: 2; text-align: center; padding: 20px; max-width: 800px; }
  .hero-eyebrow { font-family: var(--font-sans); font-size: 0.7rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 24px; animation: fadeIn 0.5s ease forwards; }
  .hero-title { font-family: var(--font-serif); font-size: clamp(3rem, 8vw, 6.5rem); font-weight: 300; line-height: 1.05; color: var(--cream); margin-bottom: 28px; animation: fadeIn 0.6s ease forwards; }
  .hero-title em { font-style: italic; color: var(--gold-light); }
  .hero-sub { font-size: 0.8rem; letter-spacing: 0.12em; color: rgba(250,247,242,0.55); margin-bottom: 48px; animation: fadeIn 0.5s 0.15s ease both; text-transform: uppercase; }
  .hero-actions { display: flex; gap: 16px; justify-content: center; animation: fadeIn 0.5s 0.25s ease both; flex-wrap: wrap; }

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
  .cat-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.92; }
  .category-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,12,16,0.5) 0%, rgba(10,12,16,0.1) 58%, rgba(10,12,16,0) 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 32px; transition: background 0.3s; }
  .category-card:hover .category-overlay { background: linear-gradient(to top, rgba(10,12,16,0.58) 0%, rgba(10,12,16,0.16) 58%, rgba(10,12,16,0) 100%); }
  .cat-label { font-family: var(--font-serif); font-size: 1.6rem; font-weight: 400; color: white; margin-bottom: 4px; }
  .cat-count { font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold-light); }

  .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 32px; max-width: 1200px; margin: 0 auto; }
  .product-card { background: white; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; }
  .product-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); }
  .product-img { aspect-ratio: 3/4; overflow: hidden; position: relative; background: var(--surface); }
  .product-img .product-photo { transition: transform 0.45s ease; }
  .product-card:hover .product-photo { transform: scale(1.05); }
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
  .product-price { font-size: 0.92rem; font-weight: 500; color: var(--charcoal); }
  .product-badge { position: absolute; top: 12px; left: 12px; z-index: 2; background: var(--charcoal); color: white; font-size: 0.58rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; }
  .product-badge-stack {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
    pointer-events: none;
  }
  .product-badge-stack .product-badge { position: static; }
  .product-badge-oos {
    background: #5a2d2d;
    color: #fff8f6;
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 4px 10px;
    border: 1px solid rgba(255,255,255,0.12);
  }
  .wishlist-btn { position: absolute; top: 12px; right: 12px; z-index: 2; background: white; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; color: var(--charcoal); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.12); transition: all 0.2s; }
  .wishlist-btn:hover { transform: scale(1.12); }
  .wishlist-btn.active { background: var(--gold); color: white; }

  .overlay-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1100; animation: fadeIn 0.25s ease; backdrop-filter: blur(3px); }
  .overlay-center {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    pointer-events: none;
  }
  .modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 1200; background: var(--surface); width: 90%; max-width: 480px; animation: scaleIn 0.3s ease; max-height: 90vh; overflow-y: auto; }
  .overlay-center .modal {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    z-index: 1;
    width: min(90vw, 480px);
    max-height: min(90vh, calc(100vh - 24px));
    pointer-events: auto;
    animation: cookieModalIn 0.25s ease both;
  }
  .overlay-center .checkout-modal {
    width: min(900px, 92vw);
    max-width: 900px;
    max-height: min(92vh, calc(100vh - 24px));
    top: auto;
    left: auto;
    transform: none;
  }
  .checkout-modal {
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    width: min(900px, 92vw);
    max-width: 900px;
    max-height: 92vh;
    height: auto;
    border-radius: 4px;
    animation: scaleIn 0.25s ease;
  }
  .checkout-modal .modal-header {
    padding: 20px 28px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    position: sticky;
    top: 0;
    z-index: 2;
  }
  .checkout-modal .modal-body {
    padding: 24px clamp(20px, 4vw, 48px) 40px;
    max-width: none;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    max-height: calc(92vh - 82px);
    overflow-y: auto;
  }
  .modal-header { padding: 28px 32px 0; display: flex; justify-content: space-between; align-items: center; }
  .modal-title { font-family: var(--font-serif); font-size: 1.6rem; font-weight: 400; }
  .close-btn { background: none; border: none; font-size: 1.4rem; cursor: pointer; color: var(--warm-gray); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
  .close-btn:hover { color: var(--charcoal); }
  .modal-body { padding: 24px 32px 32px; }
  .auth-modal-inner { position: relative; }
  .auth-otp-layer {
    position: absolute;
    inset: 0;
    z-index: 8;
    background: linear-gradient(165deg, var(--surface) 0%, var(--cream) 55%, var(--border) 100%);
    padding: 32px 28px 28px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    text-align: center;
    box-shadow: inset 0 0 0 1px rgba(232,226,217,0.9);
  }
  .auth-otp-title { font-family: var(--font-serif); font-size: 1.45rem; font-weight: 500; color: var(--charcoal); margin-bottom: 10px; }
  .auth-otp-sub { font-size: 0.72rem; color: var(--warm-gray); line-height: 1.6; margin-bottom: 22px; }
  .auth-otp-input {
    width: 100%;
    letter-spacing: 0.5em;
    text-indent: 0.25em;
    text-align: center;
    font-size: 1.35rem;
    font-weight: 600;
    padding: 16px 14px;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-variant-numeric: tabular-nums lining-nums;
    margin-bottom: 14px;
    background: var(--cream);
  }
  .auth-otp-input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,169,110,0.2); }
  .auth-otp-demo { font-size: 0.62rem; color: var(--gold); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 20px; }
  .form-hint-soft { font-size: 0.66rem; color: var(--error); margin-top: 8px; }

  .cart-drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 420px; max-width: 100vw; background: var(--cream); z-index: 1200; overflow-y: auto; border-left: 1px solid var(--border); animation: fadeInRight 0.3s ease; }
  .cart-header { padding: 24px 28px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: var(--cream); z-index: 1; }
  .cart-title { font-family: var(--font-serif); font-size: 1.5rem; }
  .cart-items { padding: 20px 28px; }
  .cart-item-wrap { padding: 16px 0; border-bottom: 1px solid var(--border); animation: fadeIn 0.3s ease; }
  .cart-item-wrap .cart-item { display: flex; gap: 14px; padding: 0; border-bottom: none; animation: none; }
  .cart-stock-above {
    font-size: 0.58rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--warm-gray);
    margin-bottom: 10px;
    text-decoration: line-through;
  }
  .cart-item-img { width: 72px; height: 90px; flex-shrink: 0; overflow: hidden; background: var(--surface); }
  .cart-item-info { flex: 1; }
  .cart-item-name { font-family: var(--font-serif); font-size: 0.95rem; margin-bottom: 4px; }
  .cart-item-open { cursor: pointer; transition: opacity 0.2s; }
  .cart-item-open:hover { opacity: 0.82; }
  .cart-item-meta { font-size: 0.7rem; color: var(--warm-gray); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.1em; }
  .cart-item-price {
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--charcoal);
    letter-spacing: 0.01em;
    font-variant-numeric: tabular-nums lining-nums;
  }
  .cart-oos-cta {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gold);
    margin-top: 8px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
  }
  .cart-oos-cta:hover { text-decoration: underline; }
  .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .qty-control { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
  .qty-btn { width: 24px; height: 24px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: var(--charcoal); }
  .qty-btn:hover { background: var(--charcoal); color: white; border-color: var(--charcoal); }
  .qty-num { font-size: 0.8rem; font-weight: 600; min-width: 20px; text-align: center; }
  .remove-btn { background: none; border: none; color: var(--warm-gray); cursor: pointer; font-size: 0.7rem; margin-left: auto; transition: color 0.2s; }
  .remove-btn:hover { color: var(--error); }
  .cart-footer { padding: 20px 28px; border-top: 1px solid var(--border); position: sticky; bottom: 0; background: var(--cream); }
  .cart-total { display: flex; justify-content: space-between; margin-bottom: 16px; align-items: baseline; }
  .cart-total-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--warm-gray); }
  .cart-total-price {
    font-family: var(--font-sans);
    font-size: 1.16rem;
    font-weight: 700;
    color: var(--charcoal);
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums lining-nums;
  }
  .checkout-btn { width: 100%; padding: 16px; background: var(--charcoal); color: white; border: none; cursor: pointer; font-family: var(--font-sans); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; transition: all 0.3s; }
  .checkout-btn:hover { background: var(--gold); }
  .empty-cart { text-align: center; padding: 60px 20px; color: var(--warm-gray); }
  .empty-cart .empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.4; }
  .empty-cart p { font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; }

  .form-group { margin-bottom: 20px; }
  .form-row-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-label { display: block; text-align: left; font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-gray); margin-bottom: 8px; }
  .form-input { width: 100%; padding: 12px 14px; border: 1px solid var(--border); background: var(--cream); font-family: var(--font-sans); font-size: 0.85rem; color: var(--charcoal); transition: border-color 0.2s; outline: none; }
  .form-input.muted-select { color: #8E867C; }
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

  .pay-method-grid { display: grid; gap: 12px; margin-bottom: 8px; width: 100%; max-width: none; }
  @media (min-width: 900px) {
    .pay-method-grid { grid-template-columns: repeat(2, minmax(260px, 1fr)); }
  }
  .pay-method-card {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    text-align: left;
    padding: 16px 44px 16px 16px;
    border: 1px solid var(--border);
    background: white;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
    border-radius: 2px;
    width: 100%;
  }
  .pay-method-card:hover { border-color: rgba(201,169,110,0.65); box-shadow: 0 6px 20px rgba(0,0,0,0.05); }
  .pay-method-card.selected { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold), 0 8px 24px rgba(201,169,110,0.14); }
  .pay-method-card-icon { width: 44px; height: 44px; border-radius: 10px; background: var(--cream); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--charcoal); }
  .pay-method-card-text { flex: 1; min-width: 0; }
  .pay-method-card-title { font-family: var(--font-serif); font-size: 1.05rem; color: var(--charcoal); margin-bottom: 4px; }
  .pay-method-card-sub { font-size: 0.65rem; color: var(--warm-gray); letter-spacing: 0.04em; line-height: 1.45; }
  .pay-method-check { position: absolute; top: 50%; right: 14px; transform: translateY(-50%); width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border); transition: all 0.2s; flex-shrink: 0; }
  .pay-method-card.selected .pay-method-check { background: var(--gold); border-color: var(--gold); }
  .pay-method-check::after { content: ""; position: absolute; inset: 3px; border-radius: 50%; background: white; opacity: 0; transform: scale(0); transition: 0.2s; }
  .pay-method-card.selected .pay-method-check::after { opacity: 1; transform: scale(1); }
  .pay-detail-hint { font-size: 0.72rem; color: var(--warm-gray); line-height: 1.65; padding: 14px 16px; background: var(--cream); border: 1px solid var(--border); margin-bottom: 16px; width: 100%; max-width: none; box-sizing: border-box; }

  .checkout-card-details-panel {
    width: 100%;
    box-sizing: border-box;
    margin-top: 8px;
    margin-bottom: 28px;
    padding: 22px clamp(18px, 3vw, 28px) 24px;
    background: linear-gradient(180deg, #FDFCFA 0%, #F6F3ED 100%);
    border: 1px solid rgba(26,26,26,0.18);
    border-radius: 3px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.75), 0 10px 32px rgba(0,0,0,0.06);
  }
  .checkout-card-details-panel > .form-group:first-of-type { margin-top: 0; }
  .checkout-card-details-title {
    font-family: var(--font-serif);
    font-size: 1.05rem;
    letter-spacing: 0.06em;
    color: var(--charcoal);
    margin: 0 0 18px;
    padding-bottom: 12px;
    border-bottom: 1px dashed rgba(26,26,26,0.2);
    text-align: center;
    text-transform: none;
  }

  .card-details-box {
    position: relative;
    background: linear-gradient(180deg, #FFFEFC 0%, #F9F5EF 100%);
    border: 1px solid rgba(201,169,110,0.5);
    box-shadow: 0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
    padding: 18px 16px 14px;
    border-radius: 3px;
    margin: 16px 0 18px;
  }
  .card-details-box::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, var(--gold), #B8915A);
    border-radius: 3px 0 0 3px;
  }
  .card-details-box-title {
    display: block;
    font-size: 0.67rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--charcoal);
    margin: 0 0 14px;
    padding-left: 10px;
    text-align: center;
    font-weight: 600;
  }

  .checkout-receipt {
    max-width: 900px;
    width: 100%;
    margin: 0 auto 24px auto;
    padding: 28px 24px 32px;
    background: linear-gradient(180deg, #FDFCFA 0%, #F5F2EC 100%);
    border: 1px dashed rgba(26,26,26,0.35);
    border-radius: 2px;
    text-align: left;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 28px rgba(0,0,0,0.07);
  }
  .checkout-receipt-store { font-family: var(--font-serif); font-size: 1.35rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--charcoal); margin-bottom: 2px; }
  .checkout-receipt-tag { font-size: 0.58rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-gray); margin-bottom: 16px; }
  .receipt-rule { height: 0; border: none; border-top: 1px dashed rgba(26,26,26,0.22); margin: 14px 0; }
  .receipt-label { font-size: 0.58rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--warm-gray); margin: 12px 0 6px; }
  .receipt-line { font-size: 0.74rem; color: var(--charcoal); line-height: 1.55; margin-bottom: 4px; }
  .receipt-line-muted { font-size: 0.7rem; color: var(--warm-gray); line-height: 1.5; margin-bottom: 3px; }
  .receipt-item-block { margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dotted rgba(26,26,26,0.15); }
  .receipt-item-name { font-size: 0.76rem; font-weight: 600; color: var(--charcoal); margin-bottom: 2px; }
  .receipt-total-block { margin-top: 14px; padding-top: 10px; border-top: 1px dashed rgba(26,26,26,0.22); }
  .receipt-total-line { font-size: 0.72rem; color: var(--charcoal); margin: 5px 0; }
  .receipt-grand { font-size: 0.85rem; font-weight: 700; letter-spacing: 0.06em; margin-top: 10px; color: var(--charcoal); }
  .receipt-footer { font-size: 0.62rem; color: var(--warm-gray); margin-top: 18px; line-height: 1.6; }
  .receipt-download-btn {
    flex: 1;
    min-width: 140px;
    padding: 14px 16px;
    background: white;
    color: var(--charcoal);
    border: 1px solid var(--border);
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    transition: border-color 0.2s, color 0.2s;
  }
  .receipt-download-btn:hover { border-color: var(--gold); color: var(--gold); }

  .profile-layout { max-width: 1100px; margin: 0 auto; padding: calc(var(--nav-offset) + 24px) 40px 60px; }
  .profile-header { display: flex; gap: 28px; align-items: center; margin-bottom: 48px; padding-bottom: 40px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .avatar { width: 80px; height: 80px; background: var(--charcoal); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-serif); font-size: 2rem; color: var(--gold-light); flex-shrink: 0; }
  .profile-name { font-family: var(--font-serif); font-size: 1.8rem; font-weight: 400; margin-bottom: 4px; }
  .profile-email { font-size: 0.75rem; color: var(--warm-gray); letter-spacing: 0.05em; }
  .profile-tabs { display: flex; gap: 0; margin-bottom: 40px; border-bottom: 1px solid var(--border); overflow-x: auto; }
  .profile-tab { padding: 12px 24px; background: none; border: none; cursor: pointer; font-family: var(--font-sans); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--warm-gray); border-bottom: 2px solid transparent; transition: all 0.2s; margin-bottom: -1px; white-space: nowrap; }
  .profile-tab.active { color: var(--charcoal); border-bottom-color: var(--gold); }

  .shop-layout { padding: calc(var(--nav-offset) + 20px) 40px 60px; max-width: 1300px; margin: 0 auto; }
  .shop-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px; }
  .shop-search-wrap { position: relative; width: 100%; max-width: 520px; margin-bottom: 20px; flex: 1 1 100%; }
  .shop-search-inner { display: flex; gap: 10px; align-items: center; background: white; border: 1px solid var(--border); padding: 10px 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
  .shop-search-inner:focus-within { border-color: var(--gold); }
  .shop-search-input { flex: 1; border: none; outline: none; font-family: var(--font-sans); font-size: 0.85rem; color: var(--charcoal); background: transparent; }
  .shop-search-input::placeholder { color: rgba(111,104,95,0.55); }
  .shop-search-close { flex-shrink: 0; background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--warm-gray); padding: 2px 4px; line-height: 1; }
  .shop-search-close:hover { color: var(--charcoal); }
  .shop-search-dropdown { position: absolute; left: 0; right: 0; top: calc(100% + 6px); background: white; border: 1px solid var(--border); box-shadow: 0 12px 40px rgba(0,0,0,0.12); z-index: 50; max-height: 320px; overflow-y: auto; }
  .shop-search-suggestion { display: flex; align-items: center; gap: 14px; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.15s; }
  .shop-search-suggestion:last-child { border-bottom: none; }
  .shop-search-suggestion:hover { background: rgba(201,169,110,0.08); }
  .shop-search-sug-thumb { width: 44px; height: 56px; flex-shrink: 0; overflow: hidden; border-radius: 2px; background: var(--surface); }
  .shop-search-sug-text { flex: 1; min-width: 0; }
  .shop-search-sug-name { font-family: var(--font-serif); font-size: 1rem; color: var(--charcoal); }
  .shop-search-sug-meta { font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--warm-gray); margin-top: 2px; }
  .shop-search-sug-badge { font-size: 0.58rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); flex-shrink: 0; }
  .shop-search-empty { padding: 14px 16px; font-size: 0.78rem; color: var(--warm-gray); }
  .product-price-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 10px; }
  .product-price-was { text-decoration: line-through; color: var(--warm-gray); font-weight: 400; font-size: 0.78rem; }
  .product-discount-pct { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--charcoal); }
  .overlay-btn:disabled { opacity: 0.45; cursor: not-allowed; }
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
    border-radius: 0;
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
.cookie-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px;
  width: 100%;
}
.cookie-content {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}
.cookie-badge {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
  .cookie-text {
    font-size: 0.72rem;
    color: var(--warm-gray);
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }
  .cookie-text a { color: var(--charcoal); text-decoration: underline; cursor: pointer; }
.cookie-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; margin-left: auto; }
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
  .cookie-btn.ghost { background: transparent; }
  .cookie-modal-backdrop {
    position: fixed; inset: 0; z-index: 2110;
    background: rgba(10,12,16,0.48);
    backdrop-filter: blur(5px);
    animation: fadeIn 0.22s ease both;
  }
  @keyframes cookieModalIn {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }
  /* Flex layer keeps modal centered; avoids scaleIn() overwriting translate(-50%,-50%). */
  .cookie-modal-layer {
    position: fixed;
    inset: 0;
    z-index: 2112;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 14px;
    pointer-events: none;
  }
  .cookie-customize-modal {
    position: relative;
    left: auto;
    top: auto;
    transform: none;
    z-index: 1;
    width: min(520px, 100%);
    max-height: min(720px, calc(100vh - 24px));
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    background: linear-gradient(180deg, #fff 0%, #faf8f5 100%);
    border: 1px solid rgba(232,226,217,0.95);
    border-radius: 6px;
    box-shadow: 0 28px 90px rgba(0,0,0,0.22);
    padding: 26px 24px 22px;
    pointer-events: auto;
    animation: cookieModalIn 0.28s ease both;
  }
  .cookie-modal-title {
    font-family: var(--font-serif);
    font-size: 1.45rem;
    font-weight: 500;
    color: var(--charcoal);
    letter-spacing: 0.02em;
    margin-bottom: 8px;
  }
  .cookie-modal-lead {
    font-size: 0.72rem;
    color: var(--warm-gray);
    line-height: 1.55;
    margin-bottom: 8px;
  }
  .cookie-modal-section {
    padding: 16px 0;
    border-bottom: 1px solid rgba(232,226,217,0.95);
  }
  .cookie-modal-section:last-of-type { border-bottom: none; }
  .cookie-modal-section .cookie-row {
    align-items: flex-start;
  }
  .cookie-detail {
    font-size: 0.68rem;
    color: var(--warm-gray);
    line-height: 1.6;
    margin-top: 8px;
    max-width: 100%;
  }
  .cookie-modal-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    flex-wrap: wrap;
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid rgba(232,226,217,0.9);
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
    padding: 0;
    font: inherit;
    color: inherit;
    display: inline-block;
    flex-shrink: 0;
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

  @media (min-width: 1024px) {
    .nav-link { font-size: 0.8rem; }
    .form-label { font-size: 0.72rem; }
    .form-input { font-size: 0.92rem; }
    .pay-method-card-sub { font-size: 0.74rem; }
    .pay-detail-hint { font-size: 0.8rem; }
    .receipt-line { font-size: 0.82rem; }
    .receipt-line-muted { font-size: 0.78rem; }
    .filter-btn { font-size: 0.72rem; }
  }
  .legal-page { max-width: 1100px; margin: 0 auto; padding: calc(var(--nav-offset) + 24px) 40px 60px; }
  .about-hero { background: var(--charcoal); padding: calc(var(--nav-offset) + 48px) 40px 72px; text-align: center; }
  .about-body { max-width: 780px; margin: 0 auto; padding: 64px 40px; }
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
  .footer-brand { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 600; letter-spacing: 0.03em; text-transform: lowercase; margin-bottom: 12px; }
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

  .product-detail { max-width: 1100px; margin: 0 auto; padding: calc(var(--nav-offset) + 24px) 40px 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
  .detail-img { position: relative; aspect-ratio: 3/4; overflow: hidden; background: var(--surface); }
  .detail-brand { font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .detail-name { font-family: var(--font-serif); font-size: 2.4rem; font-weight: 400; margin-bottom: 16px; line-height: 1.2; color: var(--charcoal); }
  .product-detail .animate-fade { color: var(--charcoal); }
  .detail-price { font-size: 1.4rem; font-weight: 600; color: var(--charcoal); margin-bottom: 28px; }
  .detail-desc { font-size: 0.82rem; color: var(--warm-gray); line-height: 1.8; margin-bottom: 32px; }
  .size-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
  .size-btn { padding: 8px 14px; border: 1px solid var(--border); background: none; cursor: pointer; font-family: var(--font-sans); font-size: 0.72rem; transition: all 0.2s; color: var(--charcoal); }
  .size-btn:hover, .size-btn.selected { background: var(--charcoal); color: white; border-color: var(--charcoal); }
  .detail-actions { display: flex; gap: 12px; }
  .add-cart-btn { flex: 1; padding: 16px; background: var(--charcoal); color: white; border: none; cursor: pointer; font-family: var(--font-sans); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; transition: background 0.3s; }
  .add-cart-btn:hover:not(:disabled) { background: var(--gold); }
  .add-cart-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .wish-btn { padding: 16px 20px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 1.2rem; color: var(--charcoal); font-weight: 700; line-height: 1; transition: all 0.2s; }
  .wish-btn:hover { background: var(--charcoal); color: white; }
  .wish-btn.active { background: var(--gold); color: white; border-color: var(--gold); }
`;

export function injectGlobalStyles() {
  if (document.getElementById("sanji-global-styles")) return;
  const styleTag = document.createElement("style");
  styleTag.id = "sanji-global-styles";
  styleTag.textContent = css;
  document.head.appendChild(styleTag);
}
