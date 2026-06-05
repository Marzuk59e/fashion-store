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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 00-.607-.541c-.013.076-.026.175-.041.26-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 00-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 00.554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 01.923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.477z" />
    </svg>
  ),
  googlepay: (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#4285F4" d="M44.5 20H24v8h11.8C34.1 33.2 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.9 0 5.5 1.1 7.5 2.8l5.7-5.7C33.9 6.7 29.2 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.4-.1-2.7-.4-4z" />
      <path fill="#34A853" d="M6.3 15.1l6.6 4.8C14.4 16.4 18.9 14 24 14c2.9 0 5.5 1.1 7.5 2.8l5.7-5.7C33.9 7.7 29.2 6 24 6c-7.6 0-14.2 4-17.7 10z" opacity=".3" />
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

        {/* ── Step Indicator ────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1.1rem 1.5rem 0.6rem", gap: 0 }}>
          {["Method", "Details", "Done"].map((label, i) => {
            const s = i + 1;
            const active = step >= s;
            const done   = step > s;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && (
                  <div style={{
                    width: 44, height: 1,
                    background: active ? "var(--gold)" : "var(--border)",
                    margin: "0 6px", transition: "background 0.35s",
                  }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: active ? "var(--gold)" : "var(--surface)",
                    color: active ? "#fff" : "var(--warm-gray)",
                    border: step === s ? "2px solid var(--charcoal)" : "2px solid transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.72rem", fontWeight: 700,
                    transition: "all 0.35s",
                  }}>
                    {done ? "✓" : s}
                  </div>
                  <span style={{
                    fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase",
                    color: active ? "var(--gold)" : "var(--warm-gray)",
                    transition: "color 0.35s",
                  }}>
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
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
              {/* Back / Cancel */}
              <button
                onClick={step === 1 ? onClose : () => { setError(""); setStep((s) => s - 1); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--warm-gray)", padding: "8px 4px",
                  fontFamily: "inherit",
                }}
              >
                {step === 1 ? "Cancel" : "← Back"}
              </button>

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
