import { useState } from "react";
import Footer from "../components/Footer.jsx";

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "18px 0", background: "none",
          border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", gap: 16,
        }}
      >
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--charcoal)", lineHeight: 1.5 }}>
          {question}
        </span>
        <span style={{
          fontSize: "1.2rem", color: open ? "var(--gold)" : "var(--warm-gray)",
          lineHeight: 1, flexShrink: 0, transition: "transform 0.25s, color 0.2s",
          display: "block", transform: open ? "rotate(45deg)" : "rotate(0)",
        }}>+</span>
      </button>
      {open && (
        <div style={{
          paddingBottom: 20, fontSize: "0.8rem",
          color: "var(--warm-gray)", lineHeight: 1.85,
        }}>
          {answer}
        </div>
      )}
    </div>
  );
}

const FAQ_SECTIONS = [
  {
    title: "Orders & Payment",
    items: [
      {
        question: "How do I place an order?",
        answer: "Browse our collection, select your size, and click 'Add to Bag'. When you're ready, open your bag and proceed to checkout. You'll need an account to complete your purchase.",
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit and debit cards (Visa, Mastercard, Amex), PayPal, Apple Pay, and Google Pay. All transactions are secured with SSL encryption.",
      },
      {
        question: "Can I modify or cancel my order after placing it?",
        answer: "Orders can be modified or cancelled within 1 hour of placement. After that, they enter our fulfilment process. Please contact us immediately via the Contact Us page if you need to make changes.",
      },
      {
        question: "Do you offer instalment or buy-now-pay-later options?",
        answer: "We are working on integrating Klarna and Afterpay. For now, full payment is required at checkout. Members can use our 'Save as payment due' feature for pre-approval purposes.",
      },
      {
        question: "Is there a promo code I can use?",
        answer: "New members can use the code SAVE10 at checkout for 10% off their first order. Subscribe to our newsletter for future offers and members-only sales.",
      },
    ],
  },
  {
    title: "Shipping & Delivery",
    items: [
      {
        question: "How long does delivery take?",
        answer: "Standard delivery takes 3–5 business days and costs $8 (free over $200). Express delivery is 1–2 business days for $20. International orders take 5–10 business days from $25.",
      },
      {
        question: "Do you ship internationally?",
        answer: "Yes, we ship to over 60 countries worldwide. International duties and taxes may apply depending on your destination country and will be the responsibility of the recipient.",
      },
      {
        question: "How do I track my order?",
        answer: "Once your order ships, you'll receive a confirmation email with a tracking link. You can also check the status of your orders anytime from your profile page.",
      },
      {
        question: "What if my order arrives damaged?",
        answer: "We're sorry to hear that. Please take photos of the damaged item and packaging, then contact us within 48 hours of delivery. We will arrange a replacement or full refund immediately.",
      },
    ],
  },
  {
    title: "Returns & Exchanges",
    items: [
      {
        question: "What is your return policy?",
        answer: "We accept returns within 30 days of delivery. Items must be unworn, unwashed, and have all original tags attached. Sale items marked 'Final Sale' are not eligible for returns.",
      },
      {
        question: "How do I start a return?",
        answer: "Log in to your account, find the order in your profile, and select 'Return Item'. We'll email you a prepaid shipping label within 24 hours. Drop it off at any post office.",
      },
      {
        question: "How long does a refund take?",
        answer: "Once we receive your return, refunds are processed within 3–5 business days. Depending on your bank or card provider, it may take a further 2–4 business days to appear.",
      },
      {
        question: "Can I exchange for a different size?",
        answer: "Yes. Contact us within 7 days of receiving your order and we'll arrange a free exchange. Subject to stock availability — we recommend checking the size guide before purchasing.",
      },
    ],
  },
  {
    title: "Products & Sizing",
    items: [
      {
        question: "How do I know which size to order?",
        answer: "Each product page includes a size guide button that shows UK, EU, US, and international sizing with chest and waist measurements. When in doubt, size up — we also accept exchanges.",
      },
      {
        question: "Are your products ethically made?",
        answer: "Yes. Every piece in our collection is sourced from artisans and heritage mills who meet our strict ethical production standards. We publish our supplier list annually in our sustainability report.",
      },
      {
        question: "How should I care for my garments?",
        answer: "Care instructions vary by product and are listed on the product detail page under 'Product Details'. Most of our pieces recommend dry clean or gentle hand wash to preserve quality.",
      },
      {
        question: "Can I request a product that's out of stock?",
        answer: "Yes! On any out-of-stock product page, click 'Request Restock'. We'll notify you by email as soon as it's available again. We also take note of frequently requested sizes.",
      },
    ],
  },
  {
    title: "Account & Privacy",
    items: [
      {
        question: "Do I need an account to shop?",
        answer: "You can browse freely without an account. However, an account is required to place orders, save your wishlist, and track your order history. Sign up takes under 30 seconds.",
      },
      {
        question: "How is my personal data used?",
        answer: "We only store what's necessary to run your account — your name, email, and order history. We do not sell your data to third parties. Read our full Privacy Policy for details.",
      },
      {
        question: "How do I delete my account?",
        answer: "To delete your account and all associated data, please contact us via the Contact Us page with the subject 'Account Deletion Request'. We will process it within 5 business days.",
      },
    ],
  },
];

// ─── FAQ Page ─────────────────────────────────────────────────────────────────
export default function FAQPage({ navigate }) {
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div className="legal-page">
      <button
        onClick={() => navigate("home")}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase",
          color: "var(--warm-gray)", marginBottom: 24, display: "flex", alignItems: "center", gap: 6,
        }}
      >
        ← Back to Home
      </button>

      <div className="legal-card">
        <div className="legal-kicker">Support</div>
        <div className="legal-h1">Frequently Asked Questions</div>
        <p className="legal-p">
          Can't find what you're looking for? Our team is happy to help — visit our{" "}
          <span
            onClick={() => navigate("contact")}
            style={{ color: "var(--gold)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Contact Us
          </span>{" "}
          page.
        </p>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          <button
            type="button"
            onClick={() => setActiveSection(null)}
            style={{
              padding: "6px 14px", fontSize: "0.7rem", letterSpacing: "0.1em",
              textTransform: "uppercase", fontWeight: 600, cursor: "pointer",
              border: "1px solid",
              borderColor: activeSection === null ? "var(--charcoal)" : "var(--border)",
              background: activeSection === null ? "var(--charcoal)" : "transparent",
              color: activeSection === null ? "var(--cream)" : "var(--warm-gray)",
              transition: "all 0.15s",
            }}
          >
            All
          </button>
          {FAQ_SECTIONS.map((s) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setActiveSection(activeSection === s.title ? null : s.title)}
              style={{
                padding: "6px 14px", fontSize: "0.7rem", letterSpacing: "0.1em",
                textTransform: "uppercase", fontWeight: 600, cursor: "pointer",
                border: "1px solid",
                borderColor: activeSection === s.title ? "var(--charcoal)" : "var(--border)",
                background: activeSection === s.title ? "var(--charcoal)" : "transparent",
                color: activeSection === s.title ? "var(--cream)" : "var(--warm-gray)",
                transition: "all 0.15s",
              }}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* FAQ sections */}
        {FAQ_SECTIONS.filter((s) => !activeSection || s.title === activeSection).map((section) => (
          <div key={section.title} style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 400,
              color: "var(--charcoal)", marginBottom: 4, paddingBottom: 12,
              borderBottom: "2px solid var(--charcoal)",
            }}>
              {section.title}
            </h2>
            {section.items.map((item) => (
              <FAQItem key={item.question} {...item} />
            ))}
          </div>
        ))}

        {/* CTA */}
        <div style={{
          marginTop: 8, padding: "24px 28px",
          background: "var(--surface)", border: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start",
        }}>
          <p style={{
            fontSize: "0.82rem", fontFamily: "var(--font-serif)", fontWeight: 400,
            color: "var(--charcoal)", margin: 0,
          }}>
            Still have questions?
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--warm-gray)", margin: 0, lineHeight: 1.7 }}>
            Our team typically responds within 24 hours on business days.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 4 }}
            onClick={() => navigate("contact")}
          >
            Contact Us
          </button>
        </div>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}
