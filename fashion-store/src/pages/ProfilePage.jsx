import { auth } from "../firebase.js";
import { sendEmailVerification } from "firebase/auth";
import ProductPhoto from "../components/ProductPhoto.jsx";
import { useState, useEffect } from "react";
import { normalizeUser, fullName, buildFulfillmentSnapshot } from "../utils/userUtils.js";
import { fmt, isOnSale } from "../utils/helpers.js";
import { paymentMethodDisplay } from "../constants/payment.js";
import { COUNTRY_OPTIONS } from "../constants/countries.js";

// ─── Profile Page ─────────────────────────────────────────────────────────────
export function fulfillmentForDisplay(order) {
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

export default function ProfilePage({ user, cart, wishlist, products, logout, tab, setTab, navigate, onMarkOrderPaid, onCancelOrder, onPayNow, onUpdateProfile, addToast, onFirebaseEmailReload }) {
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
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--charcoal)" }}>{o.id}</div>
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

