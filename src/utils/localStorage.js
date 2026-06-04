import { DEFAULT_PRODUCTS } from "../data/catalog.js";
import { COOKIE_CONSENT_KEY, GUEST_BAG_KEY } from "../constants/checkout.js";
import { hydrateGuestCartFromRaw, hydrateGuestWishlistFromRaw } from "./userUtils.js";

export const LS = {
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

export const readCookieConsent = () => {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const writeCookieConsent = (consent) => {
  try { localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent)); } catch { void 0; }
};

export const readGuestBagFromStorage = (catalog = DEFAULT_PRODUCTS) => {
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

export const writeGuestBagToStorage = (cart, wishlist) => {
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

export const clearGuestBagStorage = () => {
  try {
    localStorage.removeItem(GUEST_BAG_KEY);
  } catch {
    void 0;
  }
};
