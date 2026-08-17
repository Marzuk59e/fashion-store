// ─── PaymentModal.jsx ─────────────────────────────────────────────────────────
// 3-step payment modal: Method → Details → Confirmation
//
// USAGE in App.jsx:
//   import PaymentModal from "./components/PaymentModal.jsx";
//
//   // State
//   const [payNowOrder, setPayNowOrder] = useState(null);
//
//   // Pass to ProfilePage
//   onPayNow={(order) => setPayNowOrder(order)}
//
//   // Render modal
//   {payNowOrder && (
//     <PaymentModal
//       order={payNowOrder}
//       onClose={() => setPayNowOrder(null)}
//       onPaymentComplete={async (result) => {
//         // result = { method, transactionId, paidAt, cardMasked?, paypalEmail? }
//         const orderRef = doc(db, "orders", payNowOrder.id);
//         await updateDoc(orderRef, {
//           "payment.status":        "completed",
//           "payment.method":        result.method,
//           "payment.transactionId": result.transactionId,
//           "payment.paidAt":        result.paidAt,
//           "payment.cardMasked":    result.cardMasked  || null,
//           "payment.paypalEmail":   result.paypalEmail || null,
//         });
//         // Also update user-side order copy if you store one there:
//         // await updateDoc(doc(db, "users", uid), { orders: updatedOrders });
//         setPayNowOrder(null);
//         addToast?.("Payment successful!", "success");
//       }}
//     />
//   )}
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

// ─── SVG icons (inline, no deps) ─────────────────────────────────────────────
const Icons = {
  card: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  ),
  paypal: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#253B80" d="M7.266 21.802h-4.61c-.309 0-.542-.278-.542-.606L4.973.882C5.05.372 5.487 0 6.001 0h7.937c2.35 0 4.187.487 5.156 1.634.917 1.087 1.187 2.29.884 3.98v.001c-.023.13-.047.264-.075.4C19.043 10.9 15.98 12.6 12 12.6H9.98c-.478 0-.883.348-.958.822l-1.756 8.38z" />
      <path fill="#179BD7" d="M20.653 5.556c-.049-.216-.1-.427-.15-.63.023-.143.05-.278.077-.4h.007c.303-1.69.033-2.893-.884-3.98C18.735.487 16.9 0 14.55 0h-7.937a.943.943 0 0 0-.936.703l-3.316 20.5a.588.588 0 0 0 .594.665h4.61l1.756-8.38a.848.848 0 0 1 .958-.822h2.02c3.98 0 7.043-1.7 8.014-6.55.038-.216.08-.425.128-.628" />
    </svg>
  ),
  googlepay: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
  applepay: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  ),
};

const METHODS = [
  { id: "card",      label: "Card",       desc: "Visa, Mastercard, Amex" },
  { id: "paypal",    label: "PayPal",     desc: "Pay with your PayPal balance" },
  { id: "googlepay", label: "Google Pay", desc: "Fast checkout on supported devices" },
  { id: "applepay",  label: "Apple Pay",  desc: "Touch ID, Face ID, or device passcode" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCardNumber(v) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function fmtExpiry(v) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
function fmtTotal(total) {
  if (total == null) return "—";
  return typeof total === "number" ? `$${total.toFixed(2)}` : `$${total}`;
}

// ─── Sub-styles (shared tokens matching Sanjiiiii CSS vars) ───────────────────
const S = {
  label: {
    display: "block",
    fontSize: "0.62rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--warm-gray)",
    marginBottom: 6,
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  securityNote: {
    marginTop: 4,
    padding: "9px 12px",
    background: "rgba(181,146,76,0.06)",
    border: "1px solid rgba(181,146,76,0.18)",
    fontSize: "0.68rem",
    color: "var(--warm-gray)",
    lineHeight: 1.55,
  },
  nativePay: {
    padding: "32px 20px",
    border: "1px solid var(--border)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
};

// ─── Cancel / Back button ─────────────────────────────────────────────────────
function CancelBackBtn({ onClick, label }) {
  const [active, setActive] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
      style={{
        background: active ? "var(--charcoal)" : "#fff",
        color: active ? "#fff" : "var(--charcoal)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        fontSize: "0.68rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "10px 20px",
        fontFamily: "inherit",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PaymentModal({ order, onClose, onPaymentComplete }) {
  const [step,       setStep]       = useState(1);
  const [method,     setMethod]     = useState(null);
  const [card,       setCard]       = useState({ number: "", holder: "", expiry: "", cvv: "" });
  const [ppEmail,    setPpEmail]    = useState("");
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState("");
  const [txnId,      setTxnId]      = useState("");

  const methodMeta = METHODS.find((m) => m.id === method);

  // ── Validation ──────────────────────────────────────────────────────────────
  const step2Valid = () => {
    if (method === "card") {
      return (
        card.number.replace(/\s/g, "").length === 16 &&
        card.holder.trim().length > 1 &&
        card.expiry.length === 5 &&
        card.cvv.length === 3
      );
    }
    if (method === "paypal") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ppEmail);
    return true; // googlepay / applepay — no form
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setBusy(true);
    setError("");
    try {
      // ← Swap this sleep with your real payment gateway call (e.g. Stripe)
      await new Promise((r) => setTimeout(r, 1800));

      const txn = "TXN-" + Math.random().toString(36).slice(2, 12).toUpperCase();
      setTxnId(txn);
      setStep(3);

      await onPaymentComplete?.({
        method,
        transactionId: txn,
        paidAt: new Date().toISOString(),
        ...(method === "card"    && { cardMasked:  "•••• " + card.number.replace(/\s/g, "").slice(-4) }),
        ...(method === "paypal"  && { paypalEmail: ppEmail }),
      });
    } catch (e) {
      setError(e?.message || "Payment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget && step < 3) onClose(); }}
    >
      <div style={{
        background: "#fff",
        width: "100%", maxWidth: 460,
        maxHeight: "90vh", overflowY: "auto",
        fontFamily: "var(--font-sans, 'DM Sans', sans-serif)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
      }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: "1.5rem 1.5rem 1rem",
          borderBottom: "1px solid var(--border)",
        }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 400, color: "var(--charcoal)", margin: "0 0 4px" }}>
              Complete Payment
            </h2>
            <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", margin: 0, letterSpacing: "0.04em" }}>
              Order: {order?.id} · Total:&nbsp;
              <strong style={{ color: "var(--charcoal)" }}>{fmtTotal(order?.total)}</strong>
            </p>
          </div>
          {step < 3 && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: "var(--warm-gray)", lineHeight: 1, padding: "2px 4px" }}
            >×</button>
          )}
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div style={{ padding: "1rem 1.5rem" }}>

          {/* ─ Step 1: Method selection ─────────────────────────────────── */}
          {step === 1 && (
            <div style={{ display: "grid", gap: 8 }}>
              {METHODS.map(({ id, label, desc }) => {
                const sel = method === id;
                return (
                  <div
                    key={id}
                    onClick={() => setMethod(id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "13px 16px",
                      border: sel ? "1px solid var(--gold)" : "1px solid var(--border)",
                      background: sel ? "rgba(181,146,76,0.05)" : "#fff",
                      cursor: "pointer",
                      transition: "border 0.15s, background 0.15s",
                      borderRadius: 3,
                    }}
                  >
                    {/* icon box */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 5, flexShrink: 0,
                      background: sel ? "var(--gold)" : "var(--surface)",
                      color: sel ? "#fff" : "var(--charcoal)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.15s, color 0.15s",
                    }}>
                      {Icons[id]}
                    </div>
                    {/* text */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--charcoal)", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--warm-gray)" }}>{desc}</div>
                    </div>
                    {/* radio dot */}
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                      border: sel ? "5px solid var(--gold)" : "1.5px solid var(--border)",
                      transition: "all 0.15s",
                    }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* ─ Step 2: Info collection ──────────────────────────────────── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: "0.7rem", color: "var(--warm-gray)", marginBottom: 16, letterSpacing: "0.04em" }}>
                Paying via&nbsp;<strong style={{ color: "var(--charcoal)" }}>{methodMeta?.label}</strong>
              </p>

              {/* Card ─────────────────────────────────────── */}
              {method === "card" && (
                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <label style={S.label}>Card Number</label>
                    <input
                      className="form-input"
                      placeholder="1234 5678 9012 3456"
                      value={card.number}
                      inputMode="numeric"
                      maxLength={19}
                      onChange={(e) => setCard({ ...card, number: fmtCardNumber(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={S.label}>Cardholder Name</label>
                    <input
                      className="form-input"
                      placeholder="Name on card"
                      value={card.holder}
                      onChange={(e) => setCard({ ...card, holder: e.target.value })}
                    />
                  </div>
                  <div style={S.row2}>
                    <div>
                      <label style={S.label}>Expiry</label>
                      <input
                        className="form-input"
                        placeholder="MM/YY"
                        value={card.expiry}
                        inputMode="numeric"
                        maxLength={5}
                        onChange={(e) => setCard({ ...card, expiry: fmtExpiry(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={S.label}>CVV</label>
                      <input
                        className="form-input"
                        placeholder="•••"
                        type="password"
                        value={card.cvv}
                        inputMode="numeric"
                        maxLength={3}
                        onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                      />
                    </div>
                  </div>
                  <div style={S.securityNote}>
                    🔒 Your card details are encrypted and never stored on our servers.
                  </div>
                </div>
              )}

              {/* PayPal ───────────────────────────────────── */}
              {method === "paypal" && (
                <div style={{ ...S.nativePay, gap: 14 }}>
                  <div style={{ fontSize: "2.8rem", lineHeight: 1 }}>🅿</div>
                  <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--charcoal)", margin: 0 }}>Connect with PayPal</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", margin: 0, lineHeight: 1.55 }}>
                    Enter the email address linked to your PayPal account.
                  </p>
                  <div style={{ width: "100%", textAlign: "left" }}>
                    <label style={S.label}>PayPal Email</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="you@example.com"
                      value={ppEmail}
                      onChange={(e) => setPpEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Google Pay ──────────────────────────────── */}
              {method === "googlepay" && (
                <div style={S.nativePay}>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%",
                    background: "var(--surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {Icons.googlepay}
                  </div>
                  <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--charcoal)", margin: 0 }}>Google Pay</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", margin: 0, lineHeight: 1.6 }}>
                    Tap <strong>Confirm Payment</strong> to authorise via Google Pay.
                    A biometric or PIN confirmation may be required.
                  </p>
                </div>
              )}

              {/* Apple Pay ───────────────────────────────── */}
              {method === "applepay" && (
                <div style={S.nativePay}>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%",
                    background: "var(--charcoal)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  </div>
                  <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--charcoal)", margin: 0 }}>Apple Pay</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", margin: 0, lineHeight: 1.6 }}>
                    Tap <strong>Confirm Payment</strong> to complete with Face ID,
                    Touch ID, or your device passcode.
                  </p>
                </div>
              )}

              {error && (
                <p style={{ marginTop: 12, fontSize: "0.72rem", color: "var(--error)", textAlign: "center" }}>
                  {error}
                </p>
              )}
            </div>
          )}

          {/* ─ Step 3: Success ──────────────────────────────────────────── */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "0.5rem 0 0.25rem" }}>
              {/* Checkmark circle */}
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(39,174,96,0.1)",
                border: "2px solid var(--success)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "1.5rem", color: "var(--success)",
              }}>
                ✓
              </div>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", fontWeight: 400, color: "var(--charcoal)", margin: "0 0 4px" }}>
                Payment Successful
              </h3>
              <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginBottom: 24 }}>
                Thank you for your order
              </p>

              {/* Receipt block */}
              <div style={{
                background: "var(--surface)",
                borderTop: "2px solid var(--gold)",
                padding: "1rem",
                textAlign: "left",
                display: "grid",
                gap: 10,
              }}>
                {[
                  ["Order",          order?.id],
                  ["Amount Paid",    fmtTotal(order?.total)],
                  ["Payment Method", methodMeta?.label],
                  ["Transaction ID", txnId],
                  ["Date",           new Date().toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "0.72rem", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--warm-gray)", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.6rem", flexShrink: 0, paddingTop: 1 }}>
                      {label}
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--charcoal)", wordBreak: "break-all", textAlign: "right" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", justifyContent: step < 3 ? "space-between" : "stretch",
          alignItems: "center",
          padding: "1rem 1.5rem 1.5rem",
          borderTop: "1px solid var(--border)",
          gap: 12,
        }}>
          {step < 3 ? (
            <>
              {/* Back / Cancel — bordered box, white → black on hover/active */}
              <CancelBackBtn
                onClick={step === 1 ? onClose : () => { setError(""); setStep((s) => s - 1); }}
                label={step === 1 ? "Cancel" : "← Back"}
              />

              {/* Next / Confirm */}
              <button
                className="btn-primary"
                style={{
                  padding: "10px 28px", fontSize: "0.68rem", letterSpacing: "0.12em",
                  minWidth: 160,
                  opacity: busy || (step === 1 && !method) || (step === 2 && !step2Valid()) ? 0.45 : 1,
                  cursor: busy || (step === 1 && !method) || (step === 2 && !step2Valid()) ? "not-allowed" : "pointer",
                }}
                disabled={busy || (step === 1 && !method) || (step === 2 && !step2Valid())}
                onClick={step === 1 ? () => setStep(2) : handleConfirm}
              >
                {busy ? "Processing…" : step === 1 ? "Next →" : "Confirm Payment"}
              </button>
            </>
          ) : (
            <button
              className="btn-primary"
              style={{ padding: "10px 28px", fontSize: "0.68rem", letterSpacing: "0.12em", width: "100%" }}
              onClick={onClose}
            >
              Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
