import { useState, useEffect, useMemo, useRef } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db, isAdminAccountUid } from "./firebase.js";
import { DEFAULT_PRODUCTS } from "./data/catalog.js";
import { CATEGORY_FALLBACK_IMAGES, normalizeProductList } from "./data/productImages.js";
import ProductPhoto from "./components/ProductPhoto.jsx";
import { sendOtp as sendRegistrationOtp, verifyOtp as verifyRegistrationOtp } from "./lib/authOtp.js";

// ─── Google Fonts loaded via <link> in index.html (preconnect + stylesheet) ───

// ─── CSS ─────────────────────────────────────────────────────────────────────
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
    width: min(1100px, 94vw);
    max-width: 1100px;
    max-height: min(92vh, calc(100vh - 24px));
    top: auto;
    left: auto;
    transform: none;
  }
  .checkout-modal {
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    width: min(1100px, 94vw);
    max-width: 1100px;
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

const styleTag = document.createElement("style");
styleTag.textContent = css;
document.head.appendChild(styleTag);

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
const MIN_KIDS_PRODUCTS = 6;

function enrichCatalogWithKidsFallback(list) {
  const normalized = normalizeProductList(Array.isArray(list) ? list : []);
  const fallbackKids = normalizeProductList(DEFAULT_PRODUCTS).filter((p) => p.category === "Kids");
  const byId = new Map(normalized.map((p) => [p.id, p]));
  const kidsCount = normalized.filter((p) => p.category === "Kids").length;
  if (kidsCount >= MIN_KIDS_PRODUCTS) return normalized;

  for (const fp of fallbackKids) {
    if (!byId.has(fp.id)) {
      normalized.push(fp);
      byId.set(fp.id, fp);
    }
    if (normalized.filter((p) => p.category === "Kids").length >= MIN_KIDS_PRODUCTS) break;
  }
  return normalized;
}
const COOKIE_CONSENT_KEY = "velours_cookie_consent_v1";
const GUEST_BAG_KEY = "velours_guest_bag_v1";
const EMAIL_LINK_EMAIL_KEY = "velours_email_link_email";
const EMAIL_LINK_PROFILE_KEY = "velours_email_link_profile";
const USER_PROFILE_VERSION = 2;

const fmt = (n) => `$${n.toLocaleString()}`;

const saleDiscountPercent = (p) => {
  if (p.compareAt == null || p.compareAt <= p.price) return 0;
  return Math.round((1 - p.price / p.compareAt) * 100);
};

const productMatchesSearch = (p, query) => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const hay = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
  return words.every((w) => hay.includes(w));
};

const isOnSale = (p) => p.compareAt != null && p.compareAt > p.price;

const PAYMENT_METHOD_OPTIONS = [
  {
    id: "card",
    title: "Card",
    sub: "Visa, Mastercard, Amex",
    icon: "card",
  },
  {
    id: "paypal",
    title: "PayPal",
    sub: "Pay with your PayPal balance",
    icon: "paypal",
  },
  {
    id: "google_pay",
    title: "Google Pay",
    sub: "Fast checkout on supported devices",
    icon: "google",
  },
  {
    id: "apple_pay",
    title: "Apple Pay",
    sub: "Touch ID, Face ID, or device passcode",
    icon: "apple",
  },
];

const normalizePaymentMethodId = (raw) => {
  if (raw === "visa" || raw === "mastercard") return "card";
  if (PAYMENT_METHOD_OPTIONS.some((o) => o.id === raw)) return raw;
  return "card";
};

const paymentMethodDisplay = (payment) => {
  if (!payment?.method) return "—";
  const m = payment.method;
  const scheme = payment.cardScheme;
  if (m === "visa") return "Card (Visa)";
  if (m === "mastercard") return "Card (Mastercard)";
  if (m === "card") return `Card (${scheme === "mastercard" ? "Mastercard" : "Visa"})`;
  if (m === "paypal") return "PayPal";
  if (m === "google_pay") return "Google Pay";
  if (m === "apple_pay") return "Apple Pay";
  return String(m).replace(/_/g, " ");
};

function PayMethodIcon({ name }) {
  if (name === "card") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    );
  }
  if (name === "paypal") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M7 5h8a4.5 4.5 0 0 1 0 9h-3l-1.2 8H8.5L9.6 14H7.5L7 5z" strokeLinejoin="round" />
        <path d="M9.5 5v7" />
      </svg>
    );
  }
  if (name === "google") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.48-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

// ─── localStorage helpers ──────────────────────────────────────────────────────
const LS = {
  getUser: (email) => {
    try { const d = localStorage.getItem(`velours_user_${email}`); return d ? JSON.parse(d) : null; } catch { return null; }
  },
  saveUser: (user) => {
    try { localStorage.setItem(`velours_user_${user.email}`, JSON.stringify(user)); } catch { void 0; }
  },
  getSession: () => {
    try { const d = localStorage.getItem("velours_session"); return d ? JSON.parse(d) : null; } catch { return null; }
  },
  saveSession: (email) => {
    try { localStorage.setItem("velours_session", JSON.stringify({ email })); } catch { void 0; }
  },
  clearSession: () => {
    try { localStorage.removeItem("velours_session"); } catch { void 0; }
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
  try { localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent)); } catch { void 0; }
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

const passwordStrengthCount = (pw) => {
  const c = getPasswordChecks(pw);
  return [c.length, c.upper, c.lower, c.number, c.symbol].filter(Boolean).length;
};

const isPasswordAcceptable = (pw) => passwordStrengthCount(pw) >= 4;

const mergeGuestBag = (baseCart, guestCart) => {
  const merged = [...(baseCart || [])];
  for (const item of guestCart || []) {
    const ex = merged.findIndex((i) => i.product.id === item.product.id && i.size === item.size);
    if (ex >= 0) merged[ex] = { ...merged[ex], qty: merged[ex].qty + item.qty };
    else merged.push(item);
  }
  return merged;
};

const toFirestoreUser = (u) => {
  const clean = normalizeUser({ ...u });
  delete clean.password;
  return JSON.parse(JSON.stringify(clean));
};

const genTxId = () =>
  `TXN-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

const newOrderId = () => `ORD-${Date.now()}`;

const hydrateGuestCartFromRaw = (rawCart, catalog = DEFAULT_PRODUCTS) => {
  if (!Array.isArray(rawCart)) return [];
  const out = [];
  for (const item of rawCart) {
    const id = item?.product?.id;
    if (id == null) continue;
    const product = catalog.find((x) => x.id === id);
    if (!product) continue;
    const size = item.size || product.sizes?.[0] || "M";
    const qty = Math.max(1, Number(item.qty) || 1);
    out.push({ product, size, qty });
  }
  return out;
};

const hydrateGuestWishlistFromRaw = (raw, catalog = DEFAULT_PRODUCTS) =>
  Array.isArray(raw) ? raw.filter((id) => catalog.some((p) => p.id === id)) : [];

const readGuestBagFromStorage = (catalog = DEFAULT_PRODUCTS) => {
  try {
    const raw = localStorage.getItem(GUEST_BAG_KEY);
    if (!raw) return { cart: [], wishlist: [] };
    const d = JSON.parse(raw);
    return {
      cart: hydrateGuestCartFromRaw(d.cart, catalog),
      wishlist: hydrateGuestWishlistFromRaw(d.wishlist, catalog),
    };
  } catch {
    return { cart: [], wishlist: [] };
  }
};

const writeGuestBagToStorage = (cart, wishlist) => {
  try {
    localStorage.setItem(
      GUEST_BAG_KEY,
      JSON.stringify({
        cart: cart.map((i) => ({ product: { id: i.product.id }, size: i.size, qty: i.qty })),
        wishlist,
      }),
    );
  } catch {
    void 0;
  }
};

const clearGuestBagStorage = () => {
  try {
    localStorage.removeItem(GUEST_BAG_KEY);
  } catch {
    void 0;
  }
};

const buildFulfillmentSnapshot = (paymentCompleted) => ({
  trackingRef: `VLR-${Date.now().toString(36).toUpperCase()}`,
  note: "Demo timeline — connect a carrier or OMS API for live tracking.",
  stages: [
    { key: "placed", label: "Order placed", done: true },
    { key: "payment", label: "Payment received", done: paymentCompleted },
    { key: "processing", label: "Processing at warehouse", done: paymentCompleted },
    { key: "shipped", label: "Shipped", done: false },
    { key: "delivered", label: "Delivered", done: false },
  ],
});

const bumpFulfillmentForPaidOrder = (order) => {
  const f = order.fulfillment || buildFulfillmentSnapshot(false);
  return {
    ...f,
    stages: f.stages.map((s) =>
      s.key === "payment" || s.key === "processing" ? { ...s, done: true } : s,
    ),
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
  const [products, setProducts] = useState(() => enrichCatalogWithKidsFallback(DEFAULT_PRODUCTS));
  const catalogRef = useRef(DEFAULT_PRODUCTS);
  const [cart, setCart] = useState(() => readGuestBagFromStorage(DEFAULT_PRODUCTS).cart);
  const [wishlist, setWishlist] = useState(() => readGuestBagFromStorage(DEFAULT_PRODUCTS).wishlist);
  const [, firebaseProfileBump] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payConfirmOrder, setPayConfirmOrder] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [googleAuthBusy, setGoogleAuthBusy] = useState(false);
  const [payNowOrder, setPayNowOrder] = useState(null);
  const [payNowMethod, setPayNowMethod] = useState("card");
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
    paymentMethod: "card",
    cardScheme: "visa",
    paypalEmail: "",
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
  const [shopSearchOpen, setShopSearchOpen] = useState(false);
  const [shopSearchQuery, setShopSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [profileTab, setProfileTab] = useState("orders");
  const [notifications, setNotifications] = useState([]);
  const [stockRequestPopup, setStockRequestPopup] = useState(null);
  const checkoutPushCountRef = useRef(0);
  const checkoutProfileSyncRef = useRef(null);
  const productLayerCountRef = useRef(0);
  const pendingAuthActionRef = useRef(null);
  const ignorePopRef = useRef(false);
  const emailLinkCompletionBusyRef = useRef(false);
  const cartRef = useRef(cart);
  const wishlistRef = useRef(wishlist);
  const { toasts, add: addToast } = useToast();
  const addToastRef = useRef(addToast);

  useEffect(() => {
    addToastRef.current = addToast;
  }, [addToast]);

  useEffect(() => {
    cartRef.current = cart;
    wishlistRef.current = wishlist;
  }, [cart, wishlist]);

  useEffect(() => {
    catalogRef.current = products;
  }, [products]);

  useEffect(() => {
    const cref = doc(db, "catalog", "store");
    const unsub = onSnapshot(
      cref,
      (snap) => {
        if (!snap.exists()) {
          setProducts(enrichCatalogWithKidsFallback(DEFAULT_PRODUCTS));
          return;
        }
        const list = snap.data()?.products;
        if (Array.isArray(list) && list.length > 0) {
          setProducts(enrichCatalogWithKidsFallback(list));
        } else {
          setProducts(enrichCatalogWithKidsFallback(DEFAULT_PRODUCTS));
        }
      },
      () => {
        setProducts(enrichCatalogWithKidsFallback(DEFAULT_PRODUCTS));
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.firebaseUid) {
      setNotifications([]);
      return undefined;
    }
    const nref = query(
      collection(db, "users", user.firebaseUid, "notifications"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      nref,
      (snap) => {
        setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {
        setNotifications([]);
      },
    );
    return () => unsub();
  }, [user?.firebaseUid]);

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.removeItem("velours_theme");
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    if (user) return;
    writeGuestBagToStorage(cart, wishlist);
  }, [user, cart, wishlist]);

  const saveUserToCloud = async (updated) => {
    if (!updated?.firebaseUid) return;
    try {
      await setDoc(doc(db, "users", updated.firebaseUid), toFirestoreUser(updated), { merge: true });
    } catch (e) {
      console.error(e);
      addToast("Cloud sync failed. Data is saved on this device.", "error");
    }
  };

  const pushCheckoutHistory = (step) => {
    const nextDepth = checkoutPushCountRef.current + 1;
    checkoutPushCountRef.current = nextDepth;
    history.pushState({ kind: "checkoutStep", step, depth: nextDepth }, "", "");
  };
  const dialForCountry = (code) => COUNTRY_OPTIONS.find(c => c.code === code)?.dial || "+1";

  useEffect(() => {
    document.title = "sanjiiiii";
  }, []);

  useEffect(() => {
    if (!window.history.state?.kind) {
      history.replaceState({ kind: "app", page: "home", productId: null }, "", window.location.href);
    }
    const onPop = (e) => {
      if (ignorePopRef.current) return;
      const s = e.state;
      if (s?.kind === "checkoutStep") {
        productLayerCountRef.current = 0;
        setCheckoutOpen(true);
        setCheckoutStep(s.step);
        checkoutPushCountRef.current = s.depth ?? 1;
        return;
      }
      if (s?.kind === "app") {
        setCheckoutOpen(false);
        setCartOpen(false);
        checkoutPushCountRef.current = 0;
        if (s.page !== "product") productLayerCountRef.current = 0;
        setPage(s.page);
        if (s.productId) {
          const pr = catalogRef.current.find((x) => x.id === s.productId);
          setSelectedProduct(pr || null);
        } else {
          setSelectedProduct(null);
        }
        setShopSearchOpen(false);
        setShopSearchQuery("");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Firebase session + local email/password session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          if (await isAdminAccountUid(fbUser.uid)) {
            await signOut(auth);
            setUser(null);
            const g = readGuestBagFromStorage(catalogRef.current);
            setCart(g.cart);
            setWishlist(g.wishlist);
            return;
          }
          const ref = doc(db, "users", fbUser.uid);
          const snap = await getDoc(ref);
          const parsedNames = splitName(fbUser.displayName || "");
          let pendingNames = null;
          try {
            const raw = sessionStorage.getItem(EMAIL_LINK_PROFILE_KEY);
            if (raw) {
              const p = JSON.parse(raw);
              if (String(p?.email || "").toLowerCase() === String(fbUser.email || "").toLowerCase()) {
                pendingNames = p;
              }
            }
          } catch {
            void 0;
          }
          let base;
          if (snap.exists()) {
            base = normalizeUser({ ...snap.data(), firebaseUid: fbUser.uid });
            if (pendingNames) sessionStorage.removeItem(EMAIL_LINK_PROFILE_KEY);
          } else {
            const localLegacy = normalizeUser(LS.getUser(fbUser.email || ""));
            base = normalizeUser({
              email: fbUser.email,
              firstName: localLegacy?.firstName || pendingNames?.firstName || parsedNames.firstName,
              lastName: localLegacy?.lastName || pendingNames?.lastName || parsedNames.lastName,
              name: localLegacy?.name || (fbUser.displayName || "").trim() || (fbUser.email || "").split("@")[0] || "Member",
              profile: localLegacy?.profile || {},
              cart: localLegacy?.cart || [],
              wishlist: localLegacy?.wishlist || [],
              orders: localLegacy?.orders || [],
              firebaseUid: fbUser.uid,
            });
            if (!base.name) base.name = fullName({ firstName: base.firstName, lastName: base.lastName });
            if (pendingNames) sessionStorage.removeItem(EMAIL_LINK_PROFILE_KEY);
          }
          const mergedCart = mergeGuestBag(base.cart, cartRef.current);
          const mergedWish = [...new Set([...(base.wishlist || []), ...wishlistRef.current])];
          const finalUser = normalizeUser({ ...base, cart: mergedCart, wishlist: mergedWish, firebaseUid: fbUser.uid });
          finalUser.name = fullName({ firstName: finalUser.firstName, lastName: finalUser.lastName }) || finalUser.name || "";
          LS.saveUser(finalUser);
          LS.saveSession(finalUser.email);
          setUser(finalUser);
          setCart(mergedCart);
          setWishlist(mergedWish);
          await setDoc(ref, toFirestoreUser(finalUser), { merge: true });
          clearGuestBagStorage();
        } else {
          const session = LS.getSession();
          if (session?.email) {
            const u = normalizeUser(LS.getUser(session.email));
            if (u && !u.firebaseUid) {
              LS.saveUser(u);
              setUser(u);
              setCart(u.cart || []);
              setWishlist(u.wishlist || []);
            } else {
              setUser(null);
              const g = readGuestBagFromStorage(catalogRef.current);
              setCart(g.cart);
              setWishlist(g.wishlist);
            }
          } else {
            setUser(null);
            const g = readGuestBagFromStorage(catalogRef.current);
            setCart(g.cart);
            setWishlist(g.wishlist);
          }
        }
      } catch (e) {
        console.error(e);
        addToastRef.current("Could not load account from cloud. Create a Firestore database and deploy rules (see firestore.rules).", "error");
      }
    });
    return () => unsub();
  }, []);

  // Complete Firebase email-link sign-in when user returns from inbox (same browser).
  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return undefined;
    if (emailLinkCompletionBusyRef.current) return undefined;
    const email = sessionStorage.getItem(EMAIL_LINK_EMAIL_KEY);
    if (!email) {
      queueMicrotask(() =>
        addToastRef.current(
          "Open the sign-in link in this same browser (the tab where you asked for the email).",
          "info",
        ),
      );
      return undefined;
    }
    emailLinkCompletionBusyRef.current = true;
    let cancelled = false;

    const finishSuccess = () => {
      sessionStorage.removeItem(EMAIL_LINK_EMAIL_KEY);
      const clean = `${window.location.origin}${window.location.pathname}${window.location.hash || ""}`;
      window.history.replaceState(window.history.state, document.title, clean);
      queueMicrotask(() => {
        setAuthOpen(false);
        addToastRef.current("Email verified — you’re signed in.", "success");
      });
    };

    (async () => {
      try {
        await signInWithEmailLink(auth, email, window.location.href);
        if (cancelled) return;
        finishSuccess();
      } catch (e) {
        if (auth.currentUser) {
          if (!cancelled) finishSuccess();
        } else if (!cancelled) {
          console.error(e);
          addToastRef.current(e?.message || "Could not complete email sign-in.", "error");
        }
      } finally {
        emailLinkCompletionBusyRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
      emailLinkCompletionBusyRef.current = false;
    };
  }, []);

  // Cookie consent (GDPR)
  useEffect(() => {
    const existing = readCookieConsent();
    queueMicrotask(() => {
      if (existing && existing.version === 1) setCookieConsent(existing);
      else setCookieOpen(true);
    });
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

  const overlayBlocksBackgroundScroll =
    checkoutOpen ||
    cartOpen ||
    authOpen ||
    Boolean(payConfirmOrder) ||
    cookieOpen ||
    shopSearchOpen;

  useEffect(() => {
    if (!overlayBlocksBackgroundScroll) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [overlayBlocksBackgroundScroll]);

  useEffect(() => {
    if (!checkoutOpen) checkoutProfileSyncRef.current = null;
  }, [checkoutOpen]);

  // Auto-fill + keep checkout aligned with profile edits (without overwriting manual edits)
  useEffect(() => {
    if (!checkoutOpen || !user) return;
    const u = normalizeUser(user);
    const p = u.profile || {};
    const nextFromProfile = {
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      country: p.country || "",
      address: p.address || "",
      city: p.city || "",
      state: p.state || "",
      postalCode: p.postalCode || "",
    };
    setCheckoutDraft((prev) => {
      const last = checkoutProfileSyncRef.current;
      const next = { ...prev };
      const maybeSync = (key) => {
        const prevVal = String(prev[key] ?? "");
        const lastVal = String(last?.[key] ?? "");
        const profileVal = String(nextFromProfile[key] ?? "");
        if (!last) {
          next[key] = profileVal;
          return;
        }
        if (prevVal === lastVal) next[key] = profileVal;
      };

      (["firstName", "lastName", "email", "country", "address", "city", "state", "postalCode"]).forEach(maybeSync);
      next.phoneCode = dialForCountry(next.country || "US");
      checkoutProfileSyncRef.current = { ...nextFromProfile };
      return next;
    });
  }, [checkoutOpen, user]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKOUT_CACHE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw);
      if (!cached || typeof cached !== "object") return;
      const country = cached.country || "";
      queueMicrotask(() => {
        setCheckoutDraft((prev) => ({
          ...prev,
          firstName: cached.firstName || "",
          lastName: cached.lastName || "",
          email: cached.email || "",
          country,
          phoneCode: dialForCountry(country || "US"),
          phone: cached.phone || "",
          address: cached.address || "",
          city: cached.city || "",
          state: cached.state || "",
          postalCode: cached.postalCode || "",
          deliveryType: cached.deliveryType || "standard",
          paymentMethod: normalizePaymentMethodId(cached.paymentMethod || "card"),
          cardScheme: cached.cardScheme === "mastercard" ? "mastercard" : "visa",
          paypalEmail: cached.paypalEmail || "",
          markAsDue: Boolean(cached.markAsDue),
        }));
        setPromoCode(cached.promoCode || "");
      });
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    try {
      const safeDraft = {
        firstName: checkoutDraft.firstName,
        lastName: checkoutDraft.lastName,
        email: checkoutDraft.email,
        country: checkoutDraft.country,
        phone: checkoutDraft.phone,
        address: checkoutDraft.address,
        city: checkoutDraft.city,
        state: checkoutDraft.state,
        postalCode: checkoutDraft.postalCode,
        deliveryType: checkoutDraft.deliveryType,
        paymentMethod: checkoutDraft.paymentMethod,
        cardScheme: checkoutDraft.cardScheme,
        paypalEmail: checkoutDraft.paypalEmail,
        markAsDue: checkoutDraft.markAsDue,
        promoCode,
      };
      localStorage.setItem(CHECKOUT_CACHE_KEY, JSON.stringify(safeDraft));
    } catch {
      void 0;
    }
  }, [
    checkoutDraft.firstName,
    checkoutDraft.lastName,
    checkoutDraft.email,
    checkoutDraft.country,
    checkoutDraft.phone,
    checkoutDraft.address,
    checkoutDraft.city,
    checkoutDraft.state,
    checkoutDraft.postalCode,
    checkoutDraft.deliveryType,
    checkoutDraft.paymentMethod,
    checkoutDraft.cardScheme,
    checkoutDraft.paypalEmail,
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
    void saveUserToCloud(updated);
  };

  const promptSignIn = (action, message = "Please sign in to continue.") => {
    pendingAuthActionRef.current = action;
    setAuthMode("login");
    setAuthOpen(true);
    if (message) addToast(message);
  };

  const commitAddToCart = (product, size) => {
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

  const commitToggleWishlist = (productId) => {
    const newWish = wishlist.includes(productId) ? wishlist.filter(id => id !== productId) : [...wishlist, productId];
    setWishlist(newWish);
    persist(cart, newWish, user);
    addToast(newWish.includes(productId) ? "Added to wishlist ♡" : "Removed from wishlist");
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
    void saveUserToCloud(next);
  };

  const addToCart = (product, size) => {
    if (!user) {
      promptSignIn({ type: "cart", product, size: size || product.sizes[0] }, "Sign in to add this item to your bag.");
      return;
    }
    commitAddToCart(product, size);
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
    if (!user) {
      promptSignIn({ type: "wishlist", productId }, "Sign in to save this item to your wishlist.");
      return;
    }
    commitToggleWishlist(productId);
  };

  useEffect(() => {
    const action = pendingAuthActionRef.current;
    if (!user || !action) return;
    pendingAuthActionRef.current = null;
    if (action.type === "cart") {
      commitAddToCart(action.product, action.size);
    } else if (action.type === "wishlist") {
      commitToggleWishlist(action.productId);
    }
  }, [user]);

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
    clearGuestBagStorage();
    addToast(`Welcome${authMode === "register" ? "" : " back"}, ${finalUser.name}! 👋`, "success");
    return null;
  };

  const loginWithGoogle = async () => {
    setGoogleAuthBusy(true);
    try {
      const { user: gu } = await signInWithPopup(auth, googleProvider);
      setAuthOpen(false);
      const first = gu.displayName?.trim()?.split(/\s+/)?.[0];
      addToast(`Welcome${first ? `, ${first}` : ""}! 👋`, "success");
    } catch (e) {
      const code = e?.code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        addToast(e?.message || "Google sign-in failed.", "error");
      }
    } finally {
      setGoogleAuthBusy(false);
    }
  };

  const logout = async () => {
    LS.clearSession();
    setUser(null);
    clearGuestBagStorage();
    setCart([]);
    setWishlist([]);
    try {
      if (auth.currentUser) await signOut(auth);
    } catch { /* noop */ }
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

  const getProductDiscount = (item) => isOnSale(item?.product) ? (item.product.compareAt - item.product.price) * item.qty : 0;
  const getPricing = () => {
    const shippingFee = checkoutDraft.deliveryType === "express" ? 20 : 8;
    const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
    const itemDiscount = cart.reduce((s, i) => s + getProductDiscount(i), 0);
    const priceTotal = subtotal + itemDiscount;
    const discountedSubtotal = Math.max(0, subtotal);
    const normalizedPromo = promoCode.trim().toUpperCase();
    const promoDiscount = normalizedPromo === "SAVE10" ? discountedSubtotal * 0.1 : 0;
    const total = Math.max(0, discountedSubtotal - promoDiscount + shippingFee);
    return { shippingFee, priceTotal, subtotal, itemDiscount, discountedSubtotal, promoDiscount, total, normalizedPromo };
  };

  const downloadCheckoutReceipt = () => {
    const esc = (v) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const p = getPricing();
    const countryLabel = COUNTRY_OPTIONS.find((c) => c.code === checkoutDraft.country);
    const countryLine = countryLabel ? `${countryLabel.flag} ${countryLabel.name}` : checkoutDraft.country || "—";
    const payLabel = paymentMethodDisplay({ method: checkoutDraft.paymentMethod, cardScheme: checkoutDraft.cardScheme });
    const payExtra = checkoutDraft.markAsDue
      ? "Payment status: due"
      : checkoutDraft.paymentMethod === "card" && checkoutDraft.cardNumber
        ? maskCard(checkoutDraft.cardNumber)
        : checkoutDraft.paymentMethod === "paypal" && checkoutDraft.paypalEmail?.trim()
          ? checkoutDraft.paypalEmail.trim()
          : "—";
    const lines = cart.map((item) => {
      const lineTotal = isOnSale(item.product) ? item.product.compareAt * item.qty : item.product.price * item.qty;
      const lineDiscount = getProductDiscount(item);
      let s = `${item.product.name} × ${item.qty}\n  ${fmt(lineTotal)}`;
      if (lineDiscount > 0) s += `\n  Discount: -${fmt(lineDiscount)}`;
      return esc(s);
    });
    const body = `
<div class="checkout-receipt" style="max-width:400px;margin:0 auto;padding:28px 24px;background:#f9f7f4;border:1px dashed #333;font-family:Georgia,serif;text-align:left">
  <div style="font-size:1.2rem;letter-spacing:.2em;text-transform:uppercase;margin-bottom:4px">SANJIIIII</div>
  <div style="font-size:10px;letter-spacing:.2em;color:#666;margin-bottom:16px">ORDER SUMMARY · NOT YET PLACED</div>
  <hr style="border:none;border-top:1px dashed #999;margin:12px 0">
  <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.15em;margin:12px 0 6px">Date</div>
  <div style="font-size:13px">${new Date().toLocaleString()}</div>
  <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.15em;margin:12px 0 6px">Deliver to</div>
  <div style="font-size:13px;line-height:1.5">${esc(`${checkoutDraft.firstName} ${checkoutDraft.lastName}`)}<br>${esc(checkoutDraft.email)}<br>${esc(checkoutDraft.address || "—")}<br>${esc(`${checkoutDraft.city}${checkoutDraft.state ? `, ${checkoutDraft.state}` : ""} ${checkoutDraft.postalCode}`)}<br>${esc(countryLine)}<br>Tel: ${esc(checkoutDraft.phoneCode)} ${esc(checkoutDraft.phone || "—")}</div>
  <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.15em;margin:12px 0 6px">Delivery</div>
  <div style="font-size:13px">${checkoutDraft.deliveryType === "express" ? "Express ($20)" : "Standard ($8)"}</div>
  <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.15em;margin:12px 0 6px">Payment</div>
  <div style="font-size:13px">${esc(payLabel)}</div>
  <div style="font-size:13px;color:#555">${esc(payExtra)}</div>
  <hr style="border:none;border-top:1px dashed #999;margin:14px 0">
  <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.15em;margin-bottom:8px">Items</div>
  <pre style="font-family:inherit;font-size:13px;white-space:pre-wrap;margin:0;line-height:1.5;text-align:left">${lines.join("\n\n")}</pre>
  <hr style="border:none;border-top:1px dashed #999;margin:14px 0">
  <div style="font-size:13px;margin:4px 0">Price<br>${fmt(p.priceTotal)}</div>
  <div style="font-size:13px;margin:4px 0">Product discount<br>- ${fmt(p.itemDiscount)}</div>
  <div style="font-size:13px;margin:4px 0">After discount<br>${fmt(p.discountedSubtotal)}</div>
  ${p.promoDiscount > 0 ? `<div style="font-size:13px;margin:4px 0">Promo (${p.normalizedPromo})<br>- ${fmt(p.promoDiscount)}</div>` : ""}
  <div style="font-size:13px;margin:4px 0">Shipping<br>${fmt(p.shippingFee)}</div>
  <div style="font-size:15px;font-weight:700;margin-top:12px;letter-spacing:.05em">Total due<br>${fmt(p.total)}</div>
  <div style="font-size:11px;color:#666;margin-top:16px;line-height:1.5">Taxes (EU VAT / US sales) would appear on the final invoice after payment. This file is a preview only — place the order in the app to confirm.</div>
  <div style="font-size:11px;color:#999;margin-top:12px">Thank you for shopping with SANJIIIII</div>
</div>`;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SANJIIIII — Receipt preview</title></head><body style="margin:0;padding:24px;background:#e8e4dc">${body}</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sanjiiiii-receipt-preview-${Date.now()}.html`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    addToast("Receipt downloaded", "success");
  };

  const closeCheckout = () => {
    const d = checkoutPushCountRef.current + productLayerCountRef.current;
    checkoutPushCountRef.current = 0;
    productLayerCountRef.current = 0;
    setCheckoutOpen(false);
    setCheckoutStep(1);
    setCheckoutErrors({});
    setPromoCode("");
    if (d > 0) {
      ignorePopRef.current = true;
      history.go(-d);
      setTimeout(() => {
        ignorePopRef.current = false;
      }, 120);
    }
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
    pushCheckoutHistory(2);
  };

  const handleConfirmPayment = () => {
    if (promoCode.trim() && promoCode.trim().toUpperCase() !== "SAVE10") {
      addToast("Promo code is invalid. Try SAVE10 or leave blank.");
      return;
    }

    if (!checkoutDraft.markAsDue) {
      const pm = checkoutDraft.paymentMethod;
      if (pm === "card") {
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
      } else if (pm === "paypal") {
        const pe = checkoutDraft.paypalEmail?.trim();
        if (!pe || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pe)) {
          addToast("Please enter a valid PayPal email.");
          return;
        }
      }
    }
    setCheckoutStep(3);
    pushCheckoutHistory(3);
  };

  const handlePlaceOrder = async () => {
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
      id: newOrderId(),
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
        cardScheme: checkoutDraft.paymentMethod === "card" ? checkoutDraft.cardScheme : null,
        paypalEmail: checkoutDraft.paymentMethod === "paypal" && !checkoutDraft.markAsDue ? checkoutDraft.paypalEmail.trim() : null,
        cardMasked:
          checkoutDraft.markAsDue || checkoutDraft.paymentMethod !== "card"
            ? null
            : maskCard(checkoutDraft.cardNumber),
        status: checkoutDraft.markAsDue ? "due" : "completed",
        paidAt: checkoutDraft.markAsDue ? null : new Date().toISOString(),
        transactionId: checkoutDraft.markAsDue ? null : genTxId(),
      },
      fulfillment: buildFulfillmentSnapshot(!checkoutDraft.markAsDue),
    };

    const updatedOrders = [newOrder, ...(user.orders || [])];
    setCart([]);
    persist([], wishlist, user, updatedOrders);

    try {
      await setDoc(doc(db, "orders", newOrder.id), {
        ...newOrder,
        userName: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "—",
        userEmail: user.email || "—",
        userUid: user.firebaseUid || null,
        userId: user.firebaseUid || null,
        status: "pending",
        createdAt: serverTimestamp(),
        items: (newOrder.items || []).map(i => ({
          productId: i.product?.id,
          productName: i.product?.name,
          productPrice: i.product?.price,
          size: i.size,
          qty: i.qty,
        })),
      });
    } catch (e) {
      console.error("Order sync failed:", e);
    }

    closeCheckout();
    try { localStorage.removeItem(CHECKOUT_CACHE_KEY); } catch { void 0; }
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
      paymentMethod: "card",
      cardScheme: "visa",
      paypalEmail: "",
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

  const handleCancelOrder = (order) => {
    if (!user || !order) return;
    if (!window.confirm(`Cancel order ${order.id}? This cannot be undone.`)) return;
    const updatedOrders = (user.orders || []).map((o) => {
      if (o.id !== order.id) return o;
      return {
        ...o,
        status: "cancelled",
        payment: { ...o.payment, status: "cancelled" },
      };
    });
    persist(cart, wishlist, user, updatedOrders);
    addToast(`Order ${order.id} has been cancelled.`, "info");
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
        fulfillment: bumpFulfillmentForPaidOrder(o),
      };
    });
    persist(cart, wishlist, user, updatedOrders);
    setPayConfirmOrder(null);
    addToast(`Payment completed (${orderId})`, "success");
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const closeShopSearch = () => {
    setShopSearchOpen(false);
    setShopSearchQuery("");
  };

  const goToCollectionSearch = () => {
    const unwind = checkoutPushCountRef.current + productLayerCountRef.current;
    checkoutPushCountRef.current = 0;
    productLayerCountRef.current = 0;
    setCheckoutOpen(false);
    setSelectedProduct(null);
    setPage("shop");
    setShopSearchOpen(true);
    setShopSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    const pushApp = () => history.pushState({ kind: "app", page: "shop", productId: null }, "", "");
    if (unwind > 0) {
      ignorePopRef.current = true;
      history.go(-unwind);
      setTimeout(() => {
        ignorePopRef.current = false;
        pushApp();
      }, 120);
    } else {
      pushApp();
    }
  };

  const navigate = (p, product = null) => {
    setNavOpen(false);
    const unwind = checkoutPushCountRef.current + productLayerCountRef.current;
    checkoutPushCountRef.current = 0;
    productLayerCountRef.current = 0;
    setCheckoutOpen(false);
    setCartOpen(false);
    if (p === "product" && product) setSelectedProduct(product);
    else if (p !== "product") setSelectedProduct(null);
    setPage(p);
    setShopSearchOpen(false);
    setShopSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    const productId = p === "product" && product ? product.id : null;
    const pushApp = () => history.pushState({ kind: "app", page: p, productId }, "", "");
    if (unwind > 0) {
      ignorePopRef.current = true;
      history.go(-unwind);
      setTimeout(() => {
        ignorePopRef.current = false;
        pushApp();
      }, 120);
    } else {
      pushApp();
    }
  };

  const openProductFromCart = (product) => {
    setCartOpen(false);
    navigate("product", product);
  };

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") setNavOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [navOpen]);

  const openProductFromCheckoutFlow = (product) => {
    setCheckoutOpen(false);
    setCartOpen(false);
    setNotificationOpen(false);
    setSelectedProduct(product);
    setPage("product");
    setShopSearchOpen(false);
    setShopSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    productLayerCountRef.current += 1;
    history.pushState({ kind: "app", page: "product", productId: product.id }, "", "");
  };
  const onRequestStock = (productOrName, product = null) => {
    const prod = product || (typeof productOrName === "object" ? productOrName : null);
    if (prod && Array.isArray(prod.sizes) && prod.sizes.length > 1) {
      setStockRequestPopup({ product: prod });
      return;
    }
    const name = prod?.name || (typeof productOrName === "string" ? productOrName : "Unknown");
    submitStockRequest(name, null, prod?.id ?? null);
  };

  const submitStockRequest = async (productName, size, productId) => {
    setStockRequestPopup(null);
    try {
      await addDoc(collection(db, "stockRequests"), {
        productName,
        productId: productId ?? null,
        size: size ?? null,
        requestedAt: serverTimestamp(),
        userName: user?.name || "Guest",
        userEmail: user?.email || "guest",
        userUid: user?.firebaseUid || null,
      });
      addToast(`Stock request submitted for "${productName}" ✓`, "success");
    } catch {
      addToast(`Stock request noted for "${productName}".`, "info");
    }
  };
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <button type="button" className="nav-logo" onClick={() => navigate("home")}>sanj<span className="logo-accent">iiiii</span></button>
        <div className="nav-links nav-links--desktop">
          {[["home", "Home"], ["shop", "Collection"], ["about", "About"]].map(([p, l]) => (
            <button key={p} type="button" className={`nav-link${page === p ? " active" : ""}`} onClick={() => navigate(p)}>{l}</button>
          ))}
        </div>
        <div className="nav-icons">
          <button type="button" className="icon-btn" onClick={goToCollectionSearch} aria-label="Search collection">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /></svg>
          </button>
          <button type="button" className="icon-btn" aria-label="Wishlist" onClick={() => user ? (setProfileTab("wishlist"), navigate("profile")) : setAuthOpen(true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            {wishlist.length > 0 && <span className="badge" aria-label={`${wishlist.length} items in wishlist`}>{wishlist.length}</span>}
          </button>
          <button type="button" className="icon-btn" aria-label="Shopping bag" onClick={() => setCartOpen(true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            {cartCount > 0 && <span className="badge" aria-label={`${cartCount} items in bag`}>{cartCount}</span>}
          </button>
          {user && (
            <button className="icon-btn icon-btn--notification" onClick={() => setNotificationOpen(true)} aria-label="Notifications">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M7.5 9.5a4.5 4.5 0 1 1 9 0c0 3 .8 4.8 2 6H5.5c1.2-1.2 2-3 2-6" />
                <path d="M10 18a2 2 0 0 0 4 0" />
              </svg>
              {unreadNotificationCount > 0 && <span className="bell-dot" />}
            </button>
          )}
          {user ? (
            <button type="button" className="icon-btn" aria-label="View profile" onClick={() => navigate("profile")}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--charcoal)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "0.85rem" }}>
                {user.name[0].toUpperCase()}
              </div>
            </button>
          ) : (
            <button className="btn-primary" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>Sign In</button>
          )}
        </div>
      </nav>

      {navOpen && (
        <>
          <div className="nav-mobile-backdrop" onClick={() => setNavOpen(false)} aria-hidden />
          <div className="nav-mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu">
            <button type="button" className="close-btn nav-mobile-close" onClick={() => setNavOpen(false)} aria-label="Close menu">✕</button>
            {[["home", "Home"], ["shop", "Collection"], ["about", "About"]].map(([p, l]) => (
              <button key={p} type="button" className={`nav-link${page === p ? " active" : ""}`} onClick={() => navigate(p)}>{l}</button>
            ))}
            {!user && (
              <button
                type="button"
                className="btn-primary nav-mobile-auth"
                onClick={() => { setNavOpen(false); setAuthMode("login"); setAuthOpen(true); }}
              >
                Sign In
              </button>
            )}
          </div>
        </>
      )}

      {page === "home" && <HomePage navigate={navigate} products={products} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onRequestStock={onRequestStock} />}
      {page === "shop" && (
        <ShopPage
          products={products}
          navigate={navigate}
          filter={shopFilter}
          setFilter={setShopFilter}
          sort={shopSort}
          setSort={setShopSort}
          addToCart={addToCart}
          toggleWishlist={toggleWishlist}
          wishlist={wishlist}
          searchOpen={shopSearchOpen}
          onCloseSearch={closeShopSearch}
          searchQuery={shopSearchQuery}
          setSearchQuery={setShopSearchQuery}
          onRequestStock={onRequestStock}
        />
      )}
      {page === "product" && selectedProduct && <ProductDetailPage product={selectedProduct} navigate={navigate} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onRequestStock={onRequestStock} />}
      {page === "profile" && (
        <ProfilePage
          user={user}
          cart={cart}
          wishlist={wishlist}
          products={products}
          logout={logout}
          tab={profileTab}
          setTab={setProfileTab}
          navigate={navigate}
          onMarkOrderPaid={handleOpenMarkPaid}
          onCancelOrder={handleCancelOrder}
          onPayNow={(order) => { setPayNowOrder(order); setPayNowMethod("card"); }}
          onUpdateProfile={updateUserProfile}
          addToast={addToast}
          onFirebaseEmailReload={async () => {
            if (auth.currentUser) {
              await reload(auth.currentUser);
              firebaseProfileBump((n) => n + 1);
            }
          }}
        />
      )}
      {page === "about" && <AboutPage navigate={navigate} />}
      {page === "privacy" && <PrivacyPage navigate={navigate} />}
      {page === "terms" && <TermsPage navigate={navigate} />}

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          <div className="overlay-backdrop" onClick={() => setCartOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-header">
              <div className="cart-title">Shopping Bag <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--warm-gray)", fontWeight: 400 }}>({cartCount})</span></div>
              <button className="close-btn" aria-label="Close cart" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-icon">🛍</div>
                <p>Your bag is empty</p>
                <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => { setCartOpen(false); navigate("shop"); }}>Explore Collection</button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item, i) => {
                    const oos = item.product.inStock === false;
                    return (
                      <div className="cart-item-wrap" key={`${item.product.id}-${item.size}-${i}`}>
                        {oos && <div className="cart-stock-above">Stock</div>}
                        <div className="cart-item">
                          <div
                            role="button"
                            tabIndex={0}
                            className="cart-item-img cart-item-open"
                            onClick={() => openProductFromCart(item.product)}
                            onKeyDown={(e) => e.key === "Enter" && openProductFromCart(item.product)}
                          >
                            <ProductPhoto product={item.product} />
                          </div>
                          <div className="cart-item-info">
                            <div
                              role="button"
                              tabIndex={0}
                              className="cart-item-name cart-item-open"
                              onClick={() => openProductFromCart(item.product)}
                              onKeyDown={(e) => e.key === "Enter" && openProductFromCart(item.product)}
                            >{item.product.name}</div>
                            <div className="cart-item-meta">{item.product.brand} · Size {item.size}</div>
                            <div className="cart-item-price">{fmt(item.product.price)}</div>
                            {oos && (
                              <button
                                type="button"
                                className="cart-oos-cta"
                                onClick={() => onRequestStock(item.product.name, item.product)}
                              >
                                Request for stock
                              </button>
                            )}
                            <div className="qty-control">
                              <button type="button" className="qty-btn" onClick={() => updateQty(i, -1)}>−</button>
                              <span className="qty-num">{item.qty}</span>
                              <button type="button" className="qty-btn" onClick={() => updateQty(i, 1)} disabled={oos}>+</button>
                              <button type="button" className="remove-btn" onClick={() => removeFromCart(i)}>Remove</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="cart-footer">
                  <div className="cart-total">
                    <span className="cart-total-label">Subtotal</span>
                    <span className="cart-total-price">{fmt(cartTotal)}</span>
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--warm-gray)", textAlign: "center", margin: "-6px 0 12px", letterSpacing: "0.02em" }}>
                    VAT included where applicable (EU orders shown at checkout).
                  </div>
                  {!user && (
                    <div style={{ fontSize: "0.7rem", color: "var(--warm-gray)", marginBottom: 12, textAlign: "center" }}>
                      <span onClick={() => { setCartOpen(false); setAuthMode("login"); setAuthOpen(true); }} style={{ cursor: "pointer", textDecoration: "underline", color: "var(--gold)" }}>Sign in</span> to save your bag
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
                      checkoutPushCountRef.current = 0;
                      productLayerCountRef.current = 0;
                      setCheckoutStep(1);
                      setCheckoutOpen(true);
                      pushCheckoutHistory(1);
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

      {/* Notifications Panel */}
      {notificationOpen && (
        <>
          <div className="overlay-backdrop" onClick={() => setNotificationOpen(false)} />
          <div className="cart-drawer" style={{ right: 0, width: "min(460px, 92vw)" }}>
            <div className="cart-header">
              <div className="cart-title">Notifications</div>
              <button className="close-btn" onClick={() => setNotificationOpen(false)}>âœ•</button>
            </div>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--warm-gray)" }}>
                {unreadNotificationCount > 0 ? `${unreadNotificationCount} unread` : "All read"}
              </div>
              <button
                className="filter-btn"
                disabled={!unreadNotificationCount}
                onClick={async () => {
                  if (!user?.firebaseUid || !unreadNotificationCount) return;
                  try {
                    await Promise.all(
                      notifications
                        .filter((n) => !n.read)
                        .map((n) => updateDoc(doc(db, "users", user.firebaseUid, "notifications", n.id), { read: true })),
                    );
                  } catch {
                    void 0;
                  }
                }}
              >
                Mark all as read
              </button>
            </div>
            <div style={{ padding: 16, display: "grid", gap: 10, overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--warm-gray)", padding: "44px 0" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 10 }}>ðŸ””</div>
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} style={{ border: "1px solid var(--border)", background: "var(--surface)", padding: 12, opacity: n.read ? 0.72 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--charcoal)" }}>{n.title || "Update"}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginTop: 4 }}>{n.message || "You have a new update."}</div>
                        <div style={{ fontSize: "0.62rem", color: "var(--warm-gray)", marginTop: 6 }}>
                          {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                        </div>
                      </div>
                      {!n.read && (
                        <button
                          className="filter-btn"
                          onClick={async () => {
                            if (!user?.firebaseUid) return;
                            try {
                              await updateDoc(doc(db, "users", user.firebaseUid, "notifications", n.id), { read: true });
                            } catch {
                              void 0;
                            }
                          }}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <>
          <div className="overlay-backdrop" onClick={closeCheckout} />
          <div className="overlay-center">
            <div className="modal checkout-modal">
              <div className="modal-header">
                <div className="modal-title">Checkout</div>
                <button className="close-btn" onClick={closeCheckout}>✕</button>
              </div>
              <div className="modal-body">
                {checkoutStep === 1 && (
                  <>
                    {cart.length > 0 && (
                      <div className="form-group">
                        <label className="form-label">Your bag</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {cart.map((item, i) => (
                            <button
                              key={`${item.product.id}-${i}-${item.size}`}
                              type="button"
                              className="cart-item-open"
                              onClick={() => openProductFromCheckoutFlow(item.product)}
                              style={{
                                display: "flex",
                                gap: 14,
                                alignItems: "center",
                                padding: "12px 14px",
                                border: "1px solid var(--border)",
                                background: "var(--cream)",
                                cursor: "pointer",
                                textAlign: "left",
                                width: "100%",
                                borderRadius: 2,
                              }}
                            >
                              <div style={{ width: 56, height: 70, flexShrink: 0, overflow: "hidden", background: "var(--surface)" }}>
                                <ProductPhoto product={item.product} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", color: "var(--charcoal)" }}>{item.product.name}</div>
                                <div style={{ fontSize: "0.68rem", color: "var(--warm-gray)", marginTop: 4 }}>
                                  {item.product.brand} · Size {item.size} · Qty {item.qty}
                                  {isOnSale(item.product) ? (
                                    <> · <span style={{ textDecoration: "line-through", marginRight: 6 }}>{fmt(item.product.compareAt)}</span>{fmt(item.product.price)}</>
                                  ) : (
                                    <> · {fmt(item.product.price)}</>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <p style={{ fontSize: "0.65rem", color: "var(--warm-gray)", marginTop: 10, lineHeight: 1.5 }}>
                          Full product details like Collection. Your device or browser back button returns you to this checkout; your fields stay filled.
                        </p>
                      </div>
                    )}
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
                        className={`form-input${checkoutErrors.country ? " invalid" : ""}${!checkoutDraft.country ? " muted-select" : ""}`}
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
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" className={`filter-btn${checkoutDraft.deliveryType === "standard" ? " active" : ""}`} onClick={() => setCheckoutDraft({ ...checkoutDraft, deliveryType: "standard" })}>Standard ($8)</button>
                        <button type="button" className={`filter-btn${checkoutDraft.deliveryType === "express" ? " active" : ""}`} onClick={() => setCheckoutDraft({ ...checkoutDraft, deliveryType: "express" })}>Express ($20)</button>
                      </div>
                    </div>

                    <p className="form-label" style={{ marginBottom: 14, marginTop: 8 }}>Choose how you would like to pay</p>
                    <div className="pay-method-grid" role="radiogroup" aria-label="Payment method">
                      {PAYMENT_METHOD_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={checkoutDraft.paymentMethod === opt.id}
                          className={`pay-method-card${checkoutDraft.paymentMethod === opt.id ? " selected" : ""}`}
                          onClick={() => setCheckoutDraft({ ...checkoutDraft, paymentMethod: opt.id })}
                        >
                          <span className="pay-method-check" aria-hidden />
                          <div className="pay-method-card-icon">
                            <PayMethodIcon name={opt.icon} />
                          </div>
                          <div className="pay-method-card-text">
                            <div className="pay-method-card-title">{opt.title}</div>
                            <div className="pay-method-card-sub">{opt.sub}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="pay-detail-hint" style={{ marginTop: 4 }}>
                      Card, PayPal, Google Pay, and Apple Pay are processed through a secure payment flow.
                    </p>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: "0.75rem", cursor: "pointer", color: "var(--warm-gray)" }}>
                        <input
                          type="checkbox"
                          checked={checkoutDraft.markAsDue}
                          onChange={e => setCheckoutDraft({ ...checkoutDraft, markAsDue: e.target.checked })}
                          style={{ marginRight: 8 }}
                        />
                        Save order as payment due
                      </label>
                    </div>
                    <button type="button" className="form-submit" onClick={handleConfirmAddress}>Continue to payment details</button>
                  </>
                )}

                {checkoutStep === 2 && (
                  <>
                    <div style={{ border: "1px solid var(--border)", padding: 14, marginBottom: 18, background: "var(--cream)" }}>
                      <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", marginBottom: 10 }}>Bill Summary</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 6 }}><span>Price</span><span>{fmt(getPricing().priceTotal)}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 6 }}><span>Product Discount</span><span>- {fmt(getPricing().itemDiscount)}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 6 }}><span>After Product Discount</span><span>{fmt(getPricing().discountedSubtotal)}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 6 }}><span>Promo Discount</span><span>- {fmt(getPricing().promoDiscount)}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 10 }}><span>Delivery Charge</span><span>{fmt(getPricing().shippingFee)}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 10, fontWeight: 600 }}><span>Total</span><span>{fmt(getPricing().total)}</span></div>
                      <div style={{ marginTop: 8, fontSize: "0.7rem", color: "var(--warm-gray)", lineHeight: 1.6 }}>
                        Estimated taxes (EU VAT / US sales tax) follow your delivery address and would be calculated automatically with Stripe Tax in production.
                      </div>
                    </div>

                    {!checkoutDraft.markAsDue && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Promo Code (if any)</label>
                          <input className="form-input" placeholder="Use SAVE10" value={promoCode} onChange={e => setPromoCode(e.target.value)} />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Paying with</label>
                          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--charcoal)" }}>
                            {PAYMENT_METHOD_OPTIONS.find((o) => o.id === checkoutDraft.paymentMethod)?.title || "Payment"}
                          </div>
                        </div>
                      </>
                    )}

                    {checkoutDraft.paymentMethod === "card" && (
                      <div className="form-group">
                        <label className="form-label">Card network</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button type="button" className={`filter-btn${checkoutDraft.cardScheme === "visa" ? " active" : ""}`} onClick={() => setCheckoutDraft({ ...checkoutDraft, cardScheme: "visa" })}>Visa</button>
                          <button type="button" className={`filter-btn${checkoutDraft.cardScheme === "mastercard" ? " active" : ""}`} onClick={() => setCheckoutDraft({ ...checkoutDraft, cardScheme: "mastercard" })}>Mastercard</button>
                        </div>
                      </div>
                    )}

                    {checkoutDraft.paymentMethod === "paypal" && !checkoutDraft.markAsDue && (
                      <div className="form-group">
                        <label className="form-label">PayPal email</label>
                        <input
                          className="form-input"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={checkoutDraft.paypalEmail}
                          onChange={e => setCheckoutDraft({ ...checkoutDraft, paypalEmail: e.target.value })}
                        />
                      </div>
                    )}

                    {(checkoutDraft.paymentMethod === "google_pay" || checkoutDraft.paymentMethod === "apple_pay") && !checkoutDraft.markAsDue && (
                      <div className="pay-detail-hint">
                        {checkoutDraft.paymentMethod === "google_pay"
                          ? "On a live site, Google Pay would open here to confirm the total. No card numbers are entered on this page."
                          : "On a live site, Apple Pay would authorize on your device. Continue when you are ready to finalize on the next step."}
                      </div>
                    )}

                    {!checkoutDraft.markAsDue && checkoutDraft.paymentMethod === "card" && (
                      <>
                        <div className="card-details-box">
                          <p className="card-details-box-title">Card Details</p>
                          <div className="form-group">
                            <label className="form-label">Card Holder</label>
                            <input className="form-input" value={checkoutDraft.cardHolder} onChange={e => setCheckoutDraft({ ...checkoutDraft, cardHolder: e.target.value })} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Card Number</label>
                            <input className="form-input" placeholder="4111 1111 1111 1111" value={checkoutDraft.cardNumber} onChange={e => setCheckoutDraft({ ...checkoutDraft, cardNumber: formatCardNumber(e.target.value) })} />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div className="form-group">
                              <label className="form-label">Expiry</label>
                              <input className="form-input" maxLength={5} placeholder="MM/YY" value={checkoutDraft.expiry} onChange={e => setCheckoutDraft({ ...checkoutDraft, expiry: formatExpiry(e.target.value) })} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">CVV</label>
                              <input className="form-input" maxLength={4} placeholder="123" value={checkoutDraft.cvv} onChange={e => setCheckoutDraft({ ...checkoutDraft, cvv: e.target.value.replace(/\D/g, "") })} />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button type="button" className="filter-btn" onClick={() => history.back()}>Back</button>
                      <button type="button" className="form-submit" style={{ marginTop: 0 }} onClick={handleConfirmPayment}>Continue to review</button>
                    </div>
                  </>
                )}

                {checkoutStep === 3 && (
                  <>
                    <p className="form-label" style={{ marginBottom: 16 }}>Review your receipt</p>
                    <div className="checkout-receipt">
                      <div className="checkout-receipt-store">SANJIIIII</div>
                      <div className="checkout-receipt-tag">Order summary · not yet placed</div>
                      <hr className="receipt-rule" />
                      <div className="receipt-label">Date</div>
                      <div className="receipt-line">{new Date().toLocaleString()}</div>
                      <div className="receipt-label">Deliver to</div>
                      <div className="receipt-line">{checkoutDraft.firstName} {checkoutDraft.lastName}</div>
                      <div className="receipt-line-muted">{checkoutDraft.email}</div>
                      <div className="receipt-line-muted">{checkoutDraft.address || "—"}</div>
                      <div className="receipt-line-muted">
                        {checkoutDraft.city}{checkoutDraft.state ? `, ${checkoutDraft.state}` : ""} {checkoutDraft.postalCode}
                      </div>
                      <div className="receipt-line-muted">
                        {(() => {
                          const c = COUNTRY_OPTIONS.find((x) => x.code === checkoutDraft.country);
                          return c ? `${c.flag} ${c.name}` : checkoutDraft.country || "—";
                        })()}
                      </div>
                      <div className="receipt-line-muted">Tel: {checkoutDraft.phoneCode} {checkoutDraft.phone || "—"}</div>
                      <div className="receipt-label">Delivery</div>
                      <div className="receipt-line">{checkoutDraft.deliveryType === "express" ? "Express ($20)" : "Standard ($8)"}</div>
                      <div className="receipt-label">Payment</div>
                      <div className="receipt-line">{paymentMethodDisplay({ method: checkoutDraft.paymentMethod, cardScheme: checkoutDraft.cardScheme })}</div>
                      {checkoutDraft.markAsDue && <div className="receipt-line-muted">Payment status: due</div>}
                      {!checkoutDraft.markAsDue && checkoutDraft.paymentMethod === "paypal" && checkoutDraft.paypalEmail?.trim() && (
                        <div className="receipt-line-muted">{checkoutDraft.paypalEmail.trim()}</div>
                      )}
                      {!checkoutDraft.markAsDue && checkoutDraft.paymentMethod === "card" && checkoutDraft.cardNumber && (
                        <div className="receipt-line-muted">{maskCard(checkoutDraft.cardNumber)}</div>
                      )}
                      <hr className="receipt-rule" />
                      <div className="receipt-label">Items</div>
                      {cart.map((item, idx) => {
                        const lineTotal = isOnSale(item.product) ? item.product.compareAt * item.qty : item.product.price * item.qty;
                        const lineDiscount = getProductDiscount(item);
                        return (
                          <div key={`${item.product.id}-${idx}`} className="receipt-item-block">
                            <div className="receipt-item-name">{item.product.name} × {item.qty}</div>
                            <div className="receipt-line-muted">{fmt(lineTotal)}</div>
                            {lineDiscount > 0 && (
                              <div className="receipt-line-muted" style={{ color: "var(--success)" }}>Discount: −{fmt(lineDiscount)}</div>
                            )}
                          </div>
                        );
                      })}
                      <div className="receipt-total-block">
                        <div className="receipt-total-line">Price — {fmt(getPricing().priceTotal)}</div>
                        <div className="receipt-total-line">Product discount — −{fmt(getPricing().itemDiscount)}</div>
                        <div className="receipt-total-line">After discount — {fmt(getPricing().discountedSubtotal)}</div>
                        {getPricing().promoDiscount > 0 && (
                          <div className="receipt-total-line">Promo ({getPricing().normalizedPromo}) — −{fmt(getPricing().promoDiscount)}</div>
                        )}
                        <div className="receipt-total-line">Shipping — {fmt(getPricing().shippingFee)}</div>
                        <div className="receipt-grand">Total due — {fmt(getPricing().total)}</div>
                      </div>
                      <div className="receipt-footer">
                        Taxes (EU VAT / US sales tax) follow your address and would appear on the final invoice after payment.
                        <br /><br />
                        Thank you for shopping with SANJIIIII
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
                      <button type="button" className="filter-btn" onClick={() => history.back()}>Back</button>
                      <button type="button" className="receipt-download-btn" onClick={downloadCheckoutReceipt}>Download receipt</button>
                      <button type="button" className="form-submit" style={{ marginTop: 0, flex: "2 1 180px" }} onClick={handlePlaceOrder}>Place Order</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mark Paid Confirmation Modal */}
      {payConfirmOrder && (
        <>
          <div className="overlay-backdrop" onClick={() => setPayConfirmOrder(null)} />
          <div className="overlay-center">
            <div className="modal" style={{ maxWidth: 520 }}>
              <div className="modal-header">
                <div className="modal-title">Confirm Payment</div>
                <button className="close-btn" onClick={() => setPayConfirmOrder(null)}>✕</button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginBottom: 18, letterSpacing: "0.05em" }}>
                  Please verify this order before marking payment as completed.
                </p>
                <div style={{ background: "var(--cream)", border: "1px solid var(--border)", padding: 14, marginBottom: 16 }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", marginBottom: 8 }}>{payConfirmOrder.id}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginBottom: 6 }}>
                    Amount: {fmt(payConfirmOrder.total)}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginBottom: 6 }}>
                    Method: {paymentMethodDisplay(payConfirmOrder.payment)}
                    {payConfirmOrder.payment.cardMasked ? ` (${payConfirmOrder.payment.cardMasked})` : ""}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--warm-gray)" }}>
                    User: {payConfirmOrder.delivery.fullName}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="filter-btn" onClick={() => setPayConfirmOrder(null)}>Cancel</button>
                  <button className="btn-primary" style={{ padding: "10px 18px", fontSize: "0.65rem" }} onClick={handleConfirmMarkPaid}>
                    Confirm Paid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pay Now Modal */}
      {payNowOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setPayNowOrder(null)}>
          <div style={{ background: "var(--cream)", borderRadius: 16, padding: "32px 28px", maxWidth: 420, width: "90%", position: "relative" }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setPayNowOrder(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--warm-gray)" }}>✕</button>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: 8 }}>Complete Payment</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--warm-gray)", marginBottom: 20 }}>
              Order: {payNowOrder.id} · Total: ${payNowOrder.payment?.amount || payNowOrder.total}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {PAYMENT_METHOD_OPTIONS.map(opt => (
                <div key={opt.id} className={`pay-method-card${payNowMethod === opt.id ? " selected" : ""}`}
                  onClick={() => setPayNowMethod(opt.id)}
                  style={{ cursor: "pointer" }}>
                  <div className="pay-method-card-text" style={{ padding: "12px 16px" }}>
                    <div className="pay-method-card-title">{opt.title}</div>
                    <div className="pay-method-card-sub">{opt.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="filter-btn" onClick={() => setPayNowOrder(null)}>Cancel</button>
              <button className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.72rem" }}
                onClick={() => {
                  const now = new Date();
                  const txn = `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
                  const updatedOrders = (user.orders || []).map(o =>
                    o.id !== payNowOrder.id ? o : {
                      ...o,
                      status: "processing",
                      payment: {
                        ...o.payment,
                        status: "paid",
                        method: payNowMethod,
                        paidAt: now.toISOString(),
                        transactionId: txn,
                      },
                    }
                  );
                  persist(cart, wishlist, user, updatedOrders);
                  addToast("Payment completed successfully!", "success");
                  setPayNowOrder(null);
                }}>
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {authOpen && (
        <>
          <div className="overlay-backdrop" onClick={() => setAuthOpen(false)} />
          <div className="overlay-center">
            <AuthModal
              mode={authMode}
              setMode={setAuthMode}
              onClose={() => setAuthOpen(false)}
              onSubmit={login}
              onGoogle={loginWithGoogle}
              googleBusy={googleAuthBusy}
              addToast={addToast}
            />
          </div>
        </>
      )}
      {/* Stock Request Size Popup */}
      {stockRequestPopup && (
        <>
          <div className="overlay-backdrop" onClick={() => setStockRequestPopup(null)} />
          <div className="overlay-center">
            <div className="modal" style={{ padding: "32px 28px" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: 8 }}>
                {stockRequestPopup.product.name}
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--warm-gray)", marginBottom: 20 }}>
                Please choose a size first before submitting your stock request.
              </p>
              <div className="size-grid" style={{ marginBottom: 20 }}>
                {stockRequestPopup.product.sizes.map(s => (
                  <button
                    key={s}
                    className="size-btn"
                    onClick={() => submitStockRequest(
                      stockRequestPopup.product.name,
                      s,
                      stockRequestPopup.product.id
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                className="filter-btn"
                style={{ width: "100%", textAlign: "center" }}
                onClick={() => setStockRequestPopup(null)}
              >
                Cancel
              </button>
            </div>
          </div>
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
function HomePage({ navigate, products, addToCart, toggleWishlist, wishlist, onRequestStock }) {
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

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, delay, navigate, addToCart, toggleWishlist, wishlisted, onRequestStock }) {
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

// ─── Shop Page ────────────────────────────────────────────────────────────────
function ShopPage({ products, navigate, filter, setFilter, sort, setSort, addToCart, toggleWishlist, wishlist, searchOpen, onCloseSearch, searchQuery, setSearchQuery, onRequestStock }) {
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

// ─── Product Detail ───────────────────────────────────────────────────────────
function ProductDetailPage({ product, navigate, addToCart, toggleWishlist, wishlist, onRequestStock }) {
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

// ─── Profile Page ─────────────────────────────────────────────────────────────
function fulfillmentForDisplay(order) {
  if (order.fulfillment?.stages?.length) return order.fulfillment;
  const paid = order.payment?.status === "completed";
  return {
    trackingRef: order.payment?.transactionId ? `REF-${order.id}` : "—",
    note: "Older order — timeline inferred from payment status.",
    stages: [
      { key: "placed", label: "Order placed", done: true },
      { key: "payment", label: "Payment received", done: paid },
      { key: "processing", label: "Processing at warehouse", done: paid },
      { key: "shipped", label: "Shipped", done: false },
      { key: "delivered", label: "Delivered", done: false },
    ],
  };
}

function ProfilePage({ user, cart, wishlist, products, logout, tab, setTab, navigate, onMarkOrderPaid, onCancelOrder, onPayNow, onUpdateProfile, addToast, onFirebaseEmailReload }) {
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
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
    queueMicrotask(() => {
      setSettingsDraft({
        firstName: u?.firstName || "",
        lastName: u?.lastName || "",
        email: u?.email || "",
        country: u?.profile?.country || "",
        city: u?.profile?.city || "",
        address: u?.profile?.address || "",
        postalCode: u?.profile?.postalCode || "",
      });
    });
  }, [user]);
  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, paddingTop: 64 }}>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem" }}>Please sign in to view your profile</p>
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
          <div style={{ marginTop: 8, fontSize: "0.65rem", color: "var(--gold)", letterSpacing: "0.15em", textTransform: "uppercase" }}>✦ Member</div>
        </div>
        <button onClick={logout} style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border)", cursor: "pointer", padding: "8px 20px", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--warm-gray)", transition: "all 0.2s" }}
          onMouseOver={e => { e.currentTarget.style.background = "var(--charcoal)"; e.currentTarget.style.color = "var(--cream)"; }}
          onMouseOut={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--warm-gray)"; }}>
          Sign Out
        </button>
      </div>
      <div className="profile-tabs">
        {[["orders", "Orders"], ["cart", "Saved Bag"], ["wishlist", "Wishlist"], ["settings", "Settings"]].map(([id, label]) => (
          <button key={id} className={`profile-tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="animate-fade-d1">
        {tab === "orders" && (
          <div>
            {(user.orders || []).length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--warm-gray)" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>📦</div>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: 8, color: "var(--charcoal)" }}>No orders yet</p>
                <p style={{ fontSize: "0.75rem", marginBottom: 24 }}>Your orders will appear here.</p>
                <button className="btn-primary" onClick={() => navigate("shop")}>Start Shopping</button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {user.orders.map((o) => {
                  const ff = fulfillmentForDisplay(o);
                  return (
                    <div key={o.id} style={{ background: "var(--surface)", padding: 16, border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: "1rem" }}>{o.id}</div>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            padding: "4px 10px",
                            background: o.payment.status === "completed" ? "rgba(39,174,96,.12)" : "rgba(192,57,43,.12)",
                            color: o.payment.status === "completed" ? "var(--success)" : "var(--error)",
                            fontWeight: 700,
                          }}
                        >
                          {o.payment.status === "completed" ? "Payment Completed" : "Payment Due"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginBottom: 6 }}>
                        {new Date(o.createdAt).toLocaleString()} · {o.delivery.type === "express" ? "Express" : "Standard"} delivery
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginBottom: 6 }}>
                        Method: {paymentMethodDisplay(o.payment)}
                        {o.payment.cardMasked ? ` (${o.payment.cardMasked})` : ""}
                        {o.payment.paypalEmail ? ` · ${o.payment.paypalEmail}` : ""}
                      </div>
                      {o.payment.transactionId && (
                        <div style={{ fontSize: "0.7rem", color: "var(--warm-gray)", marginBottom: 6 }}>
                          Transaction: {o.payment.transactionId}
                        </div>
                      )}
                      {o.payment.paidAt && (
                        <div style={{ fontSize: "0.7rem", color: "var(--warm-gray)", marginBottom: 6 }}>
                          Paid At: {new Date(o.payment.paidAt).toLocaleString()}
                        </div>
                      )}
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--charcoal)" }}>
                        Total: {fmt(o.total)}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--warm-gray)", marginTop: 8, marginBottom: 10 }}>
                        {o.items.length} item{o.items.length !== 1 ? "s" : ""} · {o.delivery.fullName}, {o.delivery.city}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--warm-gray)", marginBottom: 12, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
                        <div style={{ fontWeight: 600, color: "var(--charcoal)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.62rem" }}>Order tracking</div>
                        <div style={{ marginBottom: 6 }}>Reference: <strong style={{ color: "var(--charcoal)" }}>{ff.trackingRef}</strong></div>
                        <div style={{ fontSize: "0.64rem", opacity: 0.92, marginBottom: 10, lineHeight: 1.45 }}>{ff.note}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {ff.stages.map((st) => (
                            <div key={st.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.7rem" }}>
                              <span style={{ color: st.done ? "var(--success)" : "var(--warm-gray)", fontWeight: 700, width: 14, textAlign: "center" }}>{st.done ? "✓" : "○"}</span>
                              <span style={{ color: st.done ? "var(--charcoal)" : "var(--warm-gray)" }}>{st.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="filter-btn" onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}>
                          {expandedOrderId === o.id ? "Hide Items" : "View Items"}
                        </button>
                        {o.payment?.status === "due" && (
                          <button
                            className="btn-primary"
                            style={{ padding: "8px 14px", fontSize: "0.62rem" }}
                            onClick={() => onPayNow(o)}
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                      {expandedOrderId === o.id && (
                        <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12, display: "grid", gap: 8 }}>
                          {o.items.map((item, idx) => (
                            <div key={`${o.id}-${idx}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "0.74rem" }}>
                              <span style={{ color: "var(--warm-gray)" }}>{item.product.name} · Size {item.size} · Qty {item.qty}</span>
                              <span style={{ fontWeight: 600 }}>{fmt(item.product.price * item.qty)}</span>
                            </div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--warm-gray)", marginTop: 4 }}>
                            <span>Subtotal</span>
                            <span>{fmt(o.subtotal)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--warm-gray)" }}>
                            <span>Shipping</span>
                            <span>{fmt(o.shippingFee)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {tab === "cart" && (
          <div>
            <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginBottom: 24, letterSpacing: "0.1em" }}>{cart.length} item{cart.length !== 1 ? "s" : ""} · Synced to your account</p>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>🛍</div>
                <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("shop")}>Shop Now</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20 }}>
                {cart.map((item, i) => (
                  <div key={i} style={{ background: "var(--surface)", padding: 16, cursor: "pointer" }} onClick={() => navigate("product", item.product)}>
                    <div style={{ height: 140, marginBottom: 12, overflow: "hidden", background: "var(--surface)" }}>
                      <ProductPhoto product={item.product} />
                    </div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", marginBottom: 4 }}>{item.product.name}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--warm-gray)", marginBottom: 4 }}>Size {item.size} · Qty {item.qty}</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--gold)" }}>{fmt(item.product.price * item.qty)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "wishlist" && (
          <div>
            <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginBottom: 24 }}>{wishlistProducts.length} saved item{wishlistProducts.length !== 1 ? "s" : ""}</p>
            {wishlistProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>♡</div>
                <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("shop")}>Explore Collection</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20 }}>
                {wishlistProducts.map(p => (
                  <div key={p.id} style={{ background: "var(--surface)", padding: 16, cursor: "pointer" }} onClick={() => navigate("product", p)}>
                    <div style={{ height: 140, marginBottom: 12, overflow: "hidden", background: "var(--surface)" }}>
                      <ProductPhoto product={p} />
                    </div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--warm-gray)", marginBottom: 4 }}>{p.brand}</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--gold)" }}>{fmt(p.price)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "settings" && (
          <div style={{ maxWidth: 840, width: "100%" }}>
            <div style={{ marginBottom: 24, padding: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--warm-gray)", marginBottom: 10 }}>Email verification</div>
              {!normalizedUser.firebaseUid ? (
                <p style={{ fontSize: "0.78rem", color: "var(--warm-gray)", lineHeight: 1.55 }}>
                  This email/password account is stored only in this browser. Use Google or the email magic link to get a Firebase-backed account; then you can verify your email in the cloud.
                </p>
              ) : !auth.currentUser ? (
                <p style={{ fontSize: "0.78rem", color: "var(--warm-gray)" }}>Loading sign-in status…</p>
              ) : auth.currentUser.emailVerified ? (
                <p style={{ fontSize: "0.82rem", color: "var(--success)" }}>✓ Your email is verified for this Firebase account.</p>
              ) : (
                <>
                  <p style={{ fontSize: "0.78rem", color: "var(--warm-gray)", marginBottom: 12, lineHeight: 1.5 }}>
                    Firebase has not marked this address as verified yet. Send a link from Firebase, confirm in your inbox, then tap refresh below.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: "8px 16px", fontSize: "0.62rem" }}
                      disabled={verifyBusy}
                      onClick={async () => {
                        if (!auth.currentUser) return;
                        setVerifyBusy(true);
                        try {
                          await sendEmailVerification(auth.currentUser);
                          addToast?.("Verification email sent. Check your inbox.", "info");
                        } catch (e) {
                          addToast?.(e?.message || "Could not send verification email.", "error");
                        } finally {
                          setVerifyBusy(false);
                        }
                      }}
                    >
                      {verifyBusy ? "Sending…" : "Send verification email"}
                    </button>
                    <button
                      type="button"
                      className="filter-btn"
                      onClick={async () => {
                        try {
                          await onFirebaseEmailReload?.();
                          const ok = auth.currentUser?.emailVerified;
                          addToast?.(ok ? "Email verified!" : "Still pending — check spam or resend.", ok ? "success" : "info");
                        } catch (e) {
                          addToast?.(e?.message || "Could not refresh status.", "error");
                        }
                      }}
                    >
                      I verified — refresh status
                    </button>
                  </div>
                </>
              )}
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: 20 }}>Account Details</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <button className={`filter-btn${!editingSettings ? " active" : ""}`} onClick={() => { setEditingSettings(!editingSettings); }}>
                {editingSettings ? "Cancel" : "Edit"}
              </button>
              {editingSettings && (
                <button
                  className="btn-primary"
                  style={{ padding: "8px 14px", fontSize: "0.62rem" }}
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
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  ["Name", `${normalizedUser.firstName || ""}${normalizedUser.lastName ? ` ${normalizedUser.lastName}` : ""}`.trim() || "—"],
                  ["Email", normalizedUser.email || ""],
                  ["Country / Region", normalizedUser.profile?.country || "—"],
                  ["City", normalizedUser.profile?.city || "—"],
                  ["Address", normalizedUser.profile?.address || "—"],
                  ["Postal Code", normalizedUser.profile?.postalCode || "—"],
                  ["Member Since", "2026"],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: "14px 16px", background: "var(--surface)", display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--warm-gray)" }}>{label}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 500, textAlign: "right" }}>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12, background: "var(--surface)", padding: 16, border: "1px solid var(--border)" }}>
                <div className="form-row-two">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">First Name *</label>
                    <input className="form-input" value={settingsDraft.firstName} onChange={(e) => setSettingsDraft({ ...settingsDraft, firstName: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Last Name</label>
                    <input className="form-input" value={settingsDraft.lastName} onChange={(e) => setSettingsDraft({ ...settingsDraft, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email</label>
                  <input className="form-input" value={settingsDraft.email} disabled />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Country / Region (optional)</label>
                  <select className="form-input" value={settingsDraft.country} onChange={(e) => setSettingsDraft({ ...settingsDraft, country: e.target.value })}>
                    <option value="">—</option>
                    {COUNTRY_OPTIONS.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row-two">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">City (optional)</label>
                    <input className="form-input" value={settingsDraft.city} onChange={(e) => setSettingsDraft({ ...settingsDraft, city: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Postal Code (optional)</label>
                    <input className="form-input" value={settingsDraft.postalCode} onChange={(e) => setSettingsDraft({ ...settingsDraft, postalCode: e.target.value })} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Address (optional)</label>
                  <input className="form-input" value={settingsDraft.address} onChange={(e) => setSettingsDraft({ ...settingsDraft, address: e.target.value })} />
                </div>
              </div>
            )}
            <div style={{ marginTop: 24, padding: 20, background: "var(--charcoal)", color: "white" }}>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>✦ Active Member</p>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}>You're enjoying all member benefits</p>
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
      <div className="about-hero">
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 20 }}>Est. 2018</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2.5rem,6vw,5rem)", color: "var(--cream)", fontWeight: 300, lineHeight: 1.1 }}>Fashion with<br /><em style={{ color: "var(--gold-light)" }}>Purpose</em></h1>
      </div>
      <div className="about-body">
        {[["Our Story", "sanjiiiii was born from a simple belief: that luxury and sustainability are not mutually exclusive. Founded in Paris in 2018, we source only from artisans who share our commitment to ethical production and enduring quality."],
        ["Our Philosophy", "We reject the notion of fast fashion. Every piece in our collection is designed to be worn for decades, not seasons. We work with heritage mills and independent craftspeople to ensure each garment tells a story of skilled hands and considered materials."],
        ["Sustainability", "We are committed to reducing our environmental footprint at every step. From our organic and recycled materials to our carbon-neutral shipping, every decision is made with the planet in mind."]].map(([title, body], i) => (
          <div key={title} style={{ marginBottom: 56, paddingBottom: 56, borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: 400, marginBottom: 16 }}>{title}</h2>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.9, color: "var(--warm-gray)" }}>{body}</p>
          </div>
        ))}
        <div style={{ textAlign: "center" }}>
          <button className="btn-primary" onClick={() => navigate("shop")}>Shop the Collection</button>
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ mode, setMode, onClose, onSubmit, onGoogle, googleBusy, addToast }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [registerStep, setRegisterStep] = useState("form");
  const [otpValue, setOtpValue] = useState("");
  const pendingRef = useRef(null);

  useEffect(() => {
    setRegisterStep("form");
    setOtpValue("");
    pendingRef.current = null;
    setError("");
    setForm({ username: "", email: "", password: "" });
  }, [mode]);

  const resetModeSwitch = (next) => {
    setMode(next);
  };

  const passOk = isPasswordAcceptable(form.password);
  const strengthHint = mode === "register" && form.password.length > 0 && !passOk;

  const startRegisterOtp = async () => {
    setError("");
    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();
    if (!username) {
      setError("Please enter a username.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (!form.password) {
      setError("Please enter a password.");
      return;
    }
    if (!isPasswordAcceptable(form.password)) {
      setError("Password is not strong enough.");
      return;
    }
    if (LS.getUser(email)) {
      setError("Email already registered.");
      return;
    }
    try {
      setLoading(true);
      await sendRegistrationOtp({ email, purpose: "register" });
      pendingRef.current = { firstName: username, lastName: "", email, password: form.password };
      setOtpValue("");
      setRegisterStep("otp");
      addToast?.("Verification code sent to your email.", "success");
    } catch (e) {
      setError(e?.message || "Could not send verification code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    setError("");
    const entered = otpValue.replace(/\D/g, "").slice(0, 6);
    if (entered.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    const p = pendingRef.current;
    if (!p) {
      setError("Session expired. Please start again.");
      setRegisterStep("form");
      return;
    }
    try {
      setLoading(true);
      await verifyRegistrationOtp({ email: p.email, code: entered, purpose: "register" });
      const err = await Promise.resolve(onSubmit({
        email: p.email,
        password: p.password,
        firstName: p.firstName,
        lastName: p.lastName,
      }));
      if (err) {
        setError(err);
        setRegisterStep("form");
      }
    } catch (e) {
      setError(e?.message || "Invalid code. Try again or resend.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setLoading(true);
      await sendRegistrationOtp({ email: form.email.trim().toLowerCase(), purpose: "register" });
      addToast?.("A new verification code has been sent.", "info");
      setError("");
    } catch (e) {
      setError(e?.message || "Could not resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = () => {
    setError("");
    const email = form.email.trim().toLowerCase();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    if (!form.password) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    const err = onSubmit({ email, password: form.password, firstName: "", lastName: "" });
    setLoading(false);
    if (err) setError(err);
  };

  const forgotPassword = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email) {
      setError("Enter your email first so we know where to send the link.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}${window.location.pathname}`,
      });
      addToast?.("Recovery link sent. Check your inbox to reset your password.", "info");
      setError("");
    } catch (e) {
      addToast?.(e?.message || "Could not send recovery email. Try again later.", "error");
    }
  };

  return (
    <div className="modal">
      <div className="auth-modal-inner">
        {mode === "register" && registerStep === "otp" && (
          <div className="auth-otp-layer">
            <button
              type="button"
              className="close-btn"
              style={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => {
                setRegisterStep("form");
                setOtpValue("");
                setError("");
              }}
              aria-label="Close verification"
            >
              ✕
            </button>
            <div className="auth-otp-title">Verify your email</div>
            <p className="auth-otp-sub">
              Enter the 6-digit code we sent to <strong>{form.email.trim()}</strong>.
            </p>
            <input
              className="auth-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
            <button type="button" className="form-submit" onClick={verifyOtpAndRegister} disabled={loading}>
              {loading ? "Please wait…" : "Verify & create account"}
            </button>
            <button type="button" className="filter-btn" style={{ marginTop: 12, width: "100%" }} onClick={resendOtp}>
              Resend code
            </button>
          </div>
        )}

        <div className="modal-header">
          <div className="modal-title" style={{ fontWeight: 600 }}>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </div>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginBottom: 22, letterSpacing: "0.04em", lineHeight: 1.55 }}>
            {mode === "login"
              ? "Sign in with email and password, or continue with Google or Apple."
              : "Pick a username, email, and password. After you continue, enter the 6-digit code sent to your email."}
          </p>

          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                className="form-input"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              className="form-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <div style={{ position: "relative" }}>
              <input
                className="form-input"
                type={showPass ? "text" : "password"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLoginSubmit() : startRegisterOtp())}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--warm-gray)", fontSize: "1.1rem" }}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
            {strengthHint && <p className="form-hint-soft">Password is not strong enough.</p>}
          </div>

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: -8, marginBottom: 16 }}>
              <button type="button" onClick={forgotPassword} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold)", fontWeight: 600, fontSize: "0.72rem", textDecoration: "underline" }}>
                Forgot password?
              </button>
            </div>
          )}

          {error && registerStep === "form" && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

          {mode === "login" ? (
            <button type="button" className="form-submit" onClick={handleLoginSubmit} disabled={loading}>
              {loading ? "Please wait…" : "Sign In"}
            </button>
          ) : (
            <button
              type="button"
              className="form-submit"
              onClick={startRegisterOtp}
              disabled={!passOk || !form.username.trim() || !form.email.trim() || !form.password}
            >
              Create Account
            </button>
          )}

          <div className="auth-divider">or</div>

          <div className="social-login-grid">
            <button type="button" className="btn-social" disabled={googleBusy} onClick={() => void onGoogle?.()}>
              <span className="social-icon">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </span>
              {googleBusy ? "Connecting…" : "Continue with Google"}
            </button>
            <button type="button" className="btn-social" onClick={() => addToast?.("Apple login is coming soon!", "info")}>
              <span className="social-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M17.05 20.28c-.96.95-2.04 1.9-3.32 1.9-1.25 0-1.74-.78-3.19-.78-1.47 0-1.99.76-3.21.78-1.28.02-2.48-1.04-3.44-2.02-1.97-2.01-3.48-5.69-1.46-8.79 1-1.54 2.82-2.52 4.41-2.55 1.2-.02 2.33.72 3.07.72s1.9-.76 3.32-.62c.59.03 2.26.22 3.33 1.65-.09.05-1.99 1.05-1.97 3.34.02 2.76 2.65 3.73 2.7 3.75-.02.08-.43 1.34-1.24 2.61zM12.03 7.25c-.02-2.24 1.83-4.14 4.02-4.25.02.22.04.44.04.67 0 2.12-1.89 4.19-4.06 3.58z" />
                </svg>
              </span>
              Continue with Apple
            </button>
          </div>
          <div className="auth-switch">
            {mode === "login"
              ? <>New to sanjiiiii? <button type="button" onClick={() => resetModeSwitch("register")}>Create an account</button></>
              : <>Already a member? <button type="button" onClick={() => resetModeSwitch("login")}>Sign in</button></>}
          </div>
          <p style={{ fontSize: "0.65rem", color: "var(--warm-gray)", marginTop: 18, lineHeight: 1.55 }}>
            Password accounts are stored in this browser&apos;s localStorage. Google sign-in uses Firebase in the cloud.
          </p>
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
          <div className="footer-brand">sanj<span className="logo-accent">iiiii</span></div>
          <p className="footer-desc">Luxury fashion curated for the modern connoisseur. Sustainable, ethical, timeless.</p>
        </div>
        <div>
          <div className="footer-col-title">Shop</div>
          {["Women", "Men", "Kids", "Accessories", "New Arrivals", "Sale"].map(l => <span key={l} className="footer-link" onClick={() => navigate("shop")}>{l}</span>)}
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

function CookieNotice({ open, onClose, onSave, existing, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const [locked, setLocked] = useState(true);
  const [analytics, setAnalytics] = useState(Boolean(existing?.analytics));
  const [marketing, setMarketing] = useState(Boolean(existing?.marketing));

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setExpanded(false);
      setLocked(true);
      setAnalytics(Boolean(existing?.analytics));
      setMarketing(Boolean(existing?.marketing));
    });
  }, [open, existing]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [expanded]);

  if (!open) return null;

  const acceptAll = () => onSave({ necessary: true, analytics: true, marketing: true });
  const saveCustom = () => onSave({ necessary: true, analytics, marketing });

  return (
    <>
      {/* Lock page interaction until user picks Accept All or Customize. */}
      {locked && <div className="cookie-backdrop" />}
      {expanded && (
        <div
          className="cookie-modal-backdrop"
          aria-hidden="true"
          onClick={() => setExpanded(false)}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
        />
      )}
      <div
        className="cookie-panel"
        role={expanded ? undefined : "dialog"}
        aria-modal={expanded ? undefined : "true"}
        aria-hidden={expanded}
        aria-label={expanded ? undefined : "Cookie preferences"}
      >
        <div className="cookie-top">
          <div className="cookie-content">
            <div className="cookie-badge" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <clipPath id="cookieBite">
                    <path d="M0 0 H32 V32 H0 Z" />
                    <circle cx="25" cy="6" r="7" />
                  </clipPath>
                  <mask id="biteMask">
                    <rect width="32" height="32" fill="white" />
                    <circle cx="25" cy="6" r="7" fill="black" />
                  </mask>
                </defs>
                <circle cx="15" cy="17" r="13" fill="#C9A96E" mask="url(#biteMask)" />
                <circle cx="10" cy="14" r="1.5" fill="#7A5230" mask="url(#biteMask)" />
                <circle cx="16" cy="12" r="1.3" fill="#7A5230" mask="url(#biteMask)" />
                <circle cx="11" cy="21" r="1.4" fill="#7A5230" mask="url(#biteMask)" />
                <circle cx="19" cy="20" r="1.5" fill="#7A5230" mask="url(#biteMask)" />
                <circle cx="20" cy="14" r="1.2" fill="#7A5230" mask="url(#biteMask)" />
              </svg>
            </div>
            <div className="cookie-text">
              {expanded ? (
                <>
                  Optional cookies are set in the center dialog. You can still{" "}
                  <strong style={{ color: "var(--charcoal)" }}>Accept all</strong> from here, or use Back / Save in the dialog.
                </>
              ) : (
                <>
                  We use cookies to keep the site secure, improve performance, and personalize experiences. See our{" "}
                  <a onClick={() => { onClose(); navigate("privacy"); }}>Privacy Policy</a>.
                </>
              )}
            </div>
          </div>
          <div className="cookie-actions">
            {expanded ? (
              <button type="button" className="cookie-btn primary" onClick={acceptAll}>Accept All</button>
            ) : (
              <>
                <button
                  type="button"
                  className="cookie-btn ghost"
                  onClick={() => {
                    setExpanded(true);
                    setLocked(false);
                  }}
                >
                  Customize
                </button>
                <button type="button" className="cookie-btn primary" onClick={acceptAll}>Accept All</button>
              </>
            )}
          </div>
        </div>
      </div>
      {expanded && (
        <div className="cookie-modal-layer">
          <div
            className="cookie-customize-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Customize cookie categories"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cookie-modal-title">Cookie preferences</div>
            <p className="cookie-modal-lead">
              Necessary cookies are always active so the store can load, keep you signed in safely, and remember this choice.
              You can turn optional categories on or off below. See our{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  navigate("privacy");
                }}
                style={{ color: "var(--charcoal)", textDecoration: "underline", cursor: "pointer" }}
              >
                Privacy Policy
              </a>
              .
            </p>
            <div className="cookie-modal-section">
              <div className="cookie-row">
                <div>
                  <strong>Necessary</strong>
                  <div className="cookie-detail">
                    Includes cookies needed for security (for example sign-in and session integrity), fraud prevention, network
                    protection, load balancing, and remembering your consent banner choice. They do not track you for ads and
                    cannot be disabled without breaking core features like checkout or your account area.
                  </div>
                </div>
                <div className="cookie-toggle">
                  <div className="cookie-lock">Always on</div>
                </div>
              </div>
            </div>
            <div className="cookie-modal-section">
              <div className="cookie-row">
                <div>
                  <strong>Analytics</strong>
                  <div className="cookie-detail">
                    Optional. Helps us measure how visitors use the site (for example which pages load slowly, where people drop
                    off, and whether search or filters work as intended). Data is aggregated for this demo storefront to improve
                    performance and content; it is not sold. If you turn this off, we still run the shop, but we get less signal
                    for improvements.
                  </div>
                </div>
                <div className="cookie-toggle">
                  <button
                    type="button"
                    className={`cookie-switch${analytics ? " on" : ""}`}
                    onClick={() => setAnalytics((v) => !v)}
                    role="switch"
                    aria-checked={analytics}
                    aria-label="Analytics cookies"
                  />
                </div>
              </div>
            </div>
            <div className="cookie-modal-section">
              <div className="cookie-row">
                <div>
                  <strong>Marketing</strong>
                  <div className="cookie-detail">
                    Optional. Used to remember promotions, campaign links, wishlist or cart reminders, and to test which offers
                    resonate—so messaging can feel more relevant when we run campaigns. If you disable marketing cookies, you
                    may still see generic content, but personalization and attribution across channels will be limited.
                  </div>
                </div>
                <div className="cookie-toggle">
                  <button
                    type="button"
                    className={`cookie-switch${marketing ? " on" : ""}`}
                    onClick={() => setMarketing((v) => !v)}
                    role="switch"
                    aria-checked={marketing}
                    aria-label="Marketing cookies"
                  />
                </div>
              </div>
            </div>
            <div className="cookie-modal-footer">
              <button type="button" className="cookie-btn ghost" onClick={() => setExpanded(false)}>Back</button>
              <button type="button" className="cookie-btn primary" onClick={saveCustom}>Save preferences</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PrivacyPage({ navigate }) {
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

function TermsPage({ navigate }) {
  return (
    <div className="legal-page">
      <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--warm-gray)", marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
        ← Back to Home
      </button>
      <div className="legal-card">
        <div className="legal-kicker">Legal</div>
        <div className="legal-h1">Terms & Conditions</div>
        <p className="legal-p">
          Welcome to sanjiiiii. By using this store, you agree to the following terms.
        </p>
        <ul style={{ paddingLeft: 18 }}>
          <li className="legal-li"><strong>Orders</strong>: placed through this store are saved to your account and processed accordingly.</li>
          <li className="legal-li"><strong>Pricing</strong>: displayed in USD; VAT included where applicable and shown for EU deliveries at checkout.</li>
          <li className="legal-li"><strong>Returns</strong>: accepted within 7 days of delivery for unused items in original condition.</li>
        </ul>
        <div className="legal-note">
          For EU customers: VAT is included where applicable and shown at checkout. Cookie preferences can be updated anytime via your browser settings.
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}
