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

import { injectGlobalStyles } from "./styles/globalStyles.js";
import { COUNTRY_OPTIONS } from "./constants/countries.js";
import { CHECKOUT_CACHE_KEY, COOKIE_CONSENT_KEY, GUEST_BAG_KEY, EMAIL_LINK_EMAIL_KEY, EMAIL_LINK_PROFILE_KEY } from "./constants/checkout.js";
import { PAYMENT_METHOD_OPTIONS, normalizePaymentMethodId, paymentMethodDisplay } from "./constants/payment.js";
import { enrichCatalogWithKidsFallback } from "./utils/catalog.js";
import { fmt, saleDiscountPercent, isOnSale, productMatchesSearch } from "./utils/helpers.js";
import { LS, readCookieConsent, writeCookieConsent, readGuestBagFromStorage, writeGuestBagToStorage, clearGuestBagStorage } from "./utils/localStorage.js";
import { normalizeUser, splitName, fullName, getPasswordChecks, isPasswordAcceptable, passwordStrengthCount, mergeGuestBag, toFirestoreUser, genTxId, newOrderId, hydrateGuestCartFromRaw, hydrateGuestWishlistFromRaw, buildFulfillmentSnapshot, bumpFulfillmentForPaidOrder } from "./utils/userUtils.js";
import useToast from "./hooks/useToast.js";
import PayMethodIcon from "./components/PayMethodIcon.jsx";
import ProductCard from "./components/ProductCard.jsx";
import Footer from "./components/Footer.jsx";
import AuthModal from "./components/AuthModal.jsx";
import CookieNotice from "./components/CookieNotice.jsx";
import HomePage from "./pages/HomePage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import ShippingPage from "./pages/ShippingPage.jsx";
import FAQPage from "./pages/FAQPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import PaymentModal from "./components/PaymentModal.jsx";
import OurStoryPage from "./pages/OurStoryPage.jsx";
import SustainabilityPage from "./pages/SustainabilityPage.jsx";
import CareersPage from "./pages/CareersPage.jsx";
import PressPage from "./pages/PressPage.jsx";
import StoresPage from "./pages/StoresPage.jsx";

injectGlobalStyles();

function NotificationCard({ n, user, db, doc, updateDoc }) {
  const [expanded, setExpanded] = useState(false);

  const handleMarkRead = async (e) => {
    e.stopPropagation();
    if (!user?.firebaseUid) return;
    try {
      await updateDoc(doc(db, "users", user.firebaseUid, "notifications", n.id), { read: true });
    } catch { void 0; }
  };

  const timeStr = n.createdAt?.seconds
    ? new Date(n.createdAt.seconds * 1000).toLocaleString()
    : "Just now";

  const renderDetails = () => (
    <div style={{
      marginTop: 10,
      padding: "10px 12px",
      background: "var(--cream)",
      border: "1px solid var(--border)",
      borderRadius: 2,
      fontSize: "0.7rem",
      color: "var(--charcoal)",
      lineHeight: 1.7,
      animation: "notif-expand 0.22s ease",
    }}>
      {n.orderId && <div><span style={{ color: "var(--warm-gray)" }}>Order ID:</span> <strong>{n.orderId}</strong></div>}
      {n.type && <div><span style={{ color: "var(--warm-gray)" }}>Type:</span> {n.type.charAt(0).toUpperCase() + n.type.slice(1)}</div>}
      {n.productName && <div><span style={{ color: "var(--warm-gray)" }}>Product:</span> <strong>{n.productName}</strong></div>}
      <div><span style={{ color: "var(--warm-gray)" }}>Time:</span> {timeStr}</div>
      <div style={{ marginTop: 6, color: "var(--warm-gray)" }}>{n.message || "You have a new update."}</div>
    </div>
  );

  return (
    <div
      onClick={() => setExpanded((prev) => !prev)}
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        padding: 12,
        opacity: n.read ? 0.72 : 1,
        cursor: "pointer",
        borderRadius: 2,
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.10)";
        e.currentTarget.style.borderColor = "var(--gold)";
        e.currentTarget.style.background = "var(--cream)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.background = "var(--surface)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--charcoal)" }}>
          {n.title || "Update"}
        </div>
        <span style={{
          fontSize: "0.6rem",
          color: "var(--warm-gray)",
          transition: "transform 0.18s ease",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          display: "inline-block",
        }}>▾</span>
      </div>
      <div style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginTop: 4 }}>
        {n.message || "You have a new update."}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: "0.62rem", color: "var(--warm-gray)" }}>{timeStr}</span>
        {!n.read && (
          <button
            onClick={handleMarkRead}
            style={{
              background: "var(--gold)",
              border: "none",
              color: "#1a1509",
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "4px 12px",
              cursor: "pointer",
              borderRadius: 1,
            }}
          >
            Mark Read
          </button>
        )}
      </div>
      {expanded && renderDetails()}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(() => {
    // Instantly hydrate from localStorage — no network call
    try {
      const session = LS.getSession();
      if (!session?.email) return null;
      const u = normalizeUser(LS.getUser(session.email));
      return u || null;
    } catch {
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(false);
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
  const [promoCodes, setPromoCodes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shopFilter, setShopFilter] = useState("All");
  useEffect(() => {
    const handler = (e) => setShopFilter(e.detail);
    window.addEventListener("sanjiiiii:shop-filter", handler);
    return () => window.removeEventListener("sanjiiiii:shop-filter", handler);
  }, []);
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

  /* Live promo codes from Firestore */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "promoCodes"),
      (snap) => setPromoCodes(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => setPromoCodes([]),
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
          // Check localStorage cache first — skip Firestore admin check for known customers
          const adminCacheKey = `sanj_not_admin_${fbUser.uid}`;
          const cachedNotAdmin = localStorage.getItem(adminCacheKey) === "1";

          if (!cachedNotAdmin) {
            if (await isAdminAccountUid(fbUser.uid)) {
              await signOut(auth);
              setUser(null);
              const g = readGuestBagFromStorage(catalogRef.current);
              setCart(g.cart);
              setWishlist(g.wishlist);
              return;
            }
            // Cache that this user is NOT an admin — skip check on next page load
            localStorage.setItem(adminCacheKey, "1");
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
      } finally {
        // Mark auth as resolved — whether user found or not
        setAuthReady(true);
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
    const activePromo = promoCodes.find(c => c.code === normalizedPromo && c.active === true);
    const promoDiscount = activePromo ? discountedSubtotal * (activePromo.discount / 100) : 0;
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
    if (promoCode.trim()) {
      const normalized = promoCode.trim().toUpperCase();
      const valid = promoCodes.find(c => c.code === normalized && c.active === true);
      if (!valid) {
        addToast("Promo code is invalid or expired.");
        return;
      }
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

  const handleCancelOrder = async (order) => {
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
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "cancelled",
        "payment.status": "cancelled",
        cancelledAt: serverTimestamp(),
        cancelledBy: "customer",
      });
    } catch (e) {
      console.error("Order cancel sync failed:", e);
    }
  };

  const handleConfirmMarkPaid = async () => {
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
    try {
      await updateDoc(doc(db, "orders", orderId), {
        "payment.status": "completed",
        "payment.paidAt": new Date().toISOString(),
        updatedAt: serverTimestamp(),
        paidByCustomerAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Mark as paid sync failed:", e);
    }
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
        userId: user?.firebaseUid || null,
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
          ) : authReady ? (
            <button className="btn-primary" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>Sign In</button>
          ) : (
            // Skeleton placeholder while Firebase auth resolves
            <div style={{ width: 65, height: 32, borderRadius: 4, background: "var(--charcoal)", opacity: 0.3 }} />
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

      {page === "home" && <HomePage navigate={navigate} products={products} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onRequestStock={onRequestStock} setFilter={setShopFilter} />}
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
      {page === "product" && selectedProduct && <ProductDetailPage product={selectedProduct} navigate={navigate} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onRequestStock={onRequestStock} products={products} />}
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
      {page === "shipping" && <ShippingPage navigate={navigate} />}
      {page === "faq" && <FAQPage navigate={navigate} />}
      {page === "contact" && <ContactPage navigate={navigate} />}
      {page === "our-story" && <OurStoryPage navigate={navigate} />}
      {page === "sustainability" && <SustainabilityPage navigate={navigate} />}
      {page === "careers" && <CareersPage navigate={navigate} />}
      {page === "press" && <PressPage navigate={navigate} />}
      {page === "stores" && <StoresPage navigate={navigate} />}

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
        <button className="close-btn" onClick={() => setNotificationOpen(false)}>✕</button>
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
            } catch { void 0; }
          }}
        >
          Mark all as read
        </button>
      </div>
      <div style={{ padding: 16, display: "grid", gap: 10, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--warm-gray)", padding: "44px 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: 10 }}>🔔</div>
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationCard
              key={n.id}
              n={n}
              user={user}
              db={db}
              doc={doc}
              updateDoc={updateDoc}
            />
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
<div style={{ display: "grid", gap: 8 }} role="radiogroup" aria-label="Payment method">
  {PAYMENT_METHOD_OPTIONS.map((opt) => {
    const sel = checkoutDraft.paymentMethod === opt.id;
    return (
      <button
        key={opt.id}
        type="button"
        role="radio"
        aria-checked={sel}
        onClick={() => setCheckoutDraft({ ...checkoutDraft, paymentMethod: opt.id })}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "13px 16px", textAlign: "left",
          border: sel ? "1px solid var(--gold)" : "1px solid var(--border)",
          background: sel ? "rgba(181,146,76,0.05)" : "#fff",
          cursor: "pointer", transition: "border 0.15s, background 0.15s",
          borderRadius: 3, width: "100%",
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 5, flexShrink: 0,
          background: sel ? "var(--gold)" : "var(--surface)",
          color: sel ? "#fff" : "var(--charcoal)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s, color 0.15s",
        }}>
          <PayMethodIcon name={opt.icon} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--charcoal)", marginBottom: 2 }}>{opt.title}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--warm-gray)" }}>{opt.sub}</div>
        </div>
        <div style={{
          width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
          border: sel ? "5px solid var(--gold)" : "1.5px solid var(--border)",
          transition: "all 0.15s",
        }} />
      </button>
    );
  })}
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

                    {!checkoutDraft.markAsDue && checkoutDraft.paymentMethod === "card" && (
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
  <PaymentModal
    order={payNowOrder}
    onClose={() => setPayNowOrder(null)}
    onPaymentComplete={async (result) => {
      const updatedOrders = (user.orders || []).map(o =>
        o.id !== payNowOrder.id ? o : {
          ...o,
          status: "processing",
          payment: {
            ...o.payment,
            status: "completed",
            method: result.method,
            transactionId: result.transactionId,
            paidAt: result.paidAt,
            cardMasked: result.cardMasked || o.payment.cardMasked || null,
            paypalEmail: result.paypalEmail || o.payment.paypalEmail || null,
          },
        }
      );
      persist(cart, wishlist, user, updatedOrders);
      if (user.firebaseUid) {
        try {
          await updateDoc(doc(db, "orders", payNowOrder.id), {
            "payment.status": "completed",
            "payment.method": result.method,
            "payment.transactionId": result.transactionId,
            "payment.paidAt": result.paidAt,
            "payment.cardMasked": result.cardMasked || null,
            "payment.paypalEmail": result.paypalEmail || null,
          });
        } catch (e) {
          console.error("Firestore order update failed:", e);
        }
      }
      
  // Payment notification
      if (user?.firebaseUid) {
      try {
    await addDoc(collection(db, "users", user.firebaseUid, "notifications"), {
      type:      "payment",
      orderId:   payNowOrder.id,
      message:   `Payment confirmed for order ${payNowOrder.id}. Thank you! ✦`,
      read:      false,
      createdAt: serverTimestamp(),
    });
  } catch {}
}
      

      addToast("Payment completed successfully!", "success");
    }}
  />
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

