import { DEFAULT_PRODUCTS } from "../data/catalog.js";
import { USER_PROFILE_VERSION } from "../constants/checkout.js";

export const splitName = (full) => {
  const safe = String(full || "").trim().replace(/\s+/g, " ");
  if (!safe) return { firstName: "", lastName: "" };
  const parts = safe.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

export const fullName = ({ firstName, lastName }) =>
  `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();

export const normalizeUser = (u) => {
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

export const getPasswordChecks = (pw) => {
  const s = String(pw || "");
  return {
    length: s.length >= 8,
    upper: /[A-Z]/.test(s),
    lower: /[a-z]/.test(s),
    number: /\d/.test(s),
    symbol: /[^A-Za-z0-9]/.test(s),
  };
};

export const passwordStrengthCount = (pw) => {
  const c = getPasswordChecks(pw);
  return [c.length, c.upper, c.lower, c.number, c.symbol].filter(Boolean).length;
};

export const isPasswordAcceptable = (pw) => passwordStrengthCount(pw) >= 4;

export const mergeGuestBag = (baseCart, guestCart) => {
  const merged = [...(baseCart || [])];
  for (const item of guestCart || []) {
    const ex = merged.findIndex((i) => i.product.id === item.product.id && i.size === item.size);
    if (ex >= 0) merged[ex] = { ...merged[ex], qty: merged[ex].qty + item.qty };
    else merged.push(item);
  }
  return merged;
};

export const toFirestoreUser = (u) => {
  const clean = normalizeUser({ ...u });
  delete clean.password;
  return JSON.parse(JSON.stringify(clean));
};

export const genTxId = () =>
  `TXN-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

export const newOrderId = () => `ORD-${Date.now()}`;

export const hydrateGuestCartFromRaw = (rawCart, catalog = DEFAULT_PRODUCTS) => {
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

export const hydrateGuestWishlistFromRaw = (raw, catalog = DEFAULT_PRODUCTS) =>
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

export const buildFulfillmentSnapshot = (paymentCompleted) => ({
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

export const bumpFulfillmentForPaidOrder = (order) => {
  const f = order.fulfillment || buildFulfillmentSnapshot(false);
  return {
    ...f,
    stages: f.stages.map((s) =>
      s.key === "payment" || s.key === "processing" ? { ...s, done: true } : s,
    ),
  };
};

