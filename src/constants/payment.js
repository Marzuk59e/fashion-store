export const PAYMENT_METHOD_OPTIONS = [
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

export const normalizePaymentMethodId = (raw) => {
  if (raw === "visa" || raw === "mastercard") return "card";
  if (PAYMENT_METHOD_OPTIONS.some((o) => o.id === raw)) return raw;
  return "card";
};

export const paymentMethodDisplay = (payment) => {
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
