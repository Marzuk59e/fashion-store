import { useState } from "react";
import Footer from "../components/Footer.jsx";

// ─── Contact Page ─────────────────────────────────────────────────────────────
export default function ContactPage({ navigate }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "General Inquiry", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: false }));
  };

  const handleSubmit = () => {
    const next = {};
    if (!form.name.trim()) next.name = true;
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = true;
    if (!form.message.trim()) next.message = true;
    if (Object.keys(next).length) { setErrors(next); return; }

    setBusy(true);
    // Simulate submit (wire to Firestore / email service in production)
    setTimeout(() => {
      setBusy(false);
      setSubmitted(true);
    }, 900);
  };

  const inputStyle = (key) => ({
    width: "100%", padding: "13px 16px",
    background: "var(--cream)", color: "var(--charcoal)",
    border: `1px solid ${errors[key] ? "#C0392B" : "var(--border)"}`,
    fontSize: "0.85rem", fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s",
  });

  const labelStyle = {
    display: "block", fontSize: "0.65rem", letterSpacing: "0.16em",
    textTransform: "uppercase", fontWeight: 600, color: "var(--warm-gray)",
    marginBottom: 7,
  };

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
        <div className="legal-kicker">Get in Touch</div>
        <div className="legal-h1">Contact Us</div>
        <p className="legal-p">
          We're here to help. Whether you have a question about an order, need styling advice, or just want to say hello — reach out and we'll get back to you within one business day.
        </p>

      {/* Contact methods */}
      <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12, marginBottom: 36,
        }}>
          {[
            { icon: "✉", label: "Email", value: "hello@sanjiiiii.com", note: "Response within 24hrs" },
            { icon: "◎", label: "Live Chat", value: "Mon–Fri, 9am–6pm", note: "Available in the app" },
            { icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="7"/>
                <polyline points="12 9 12 12 13.5 13.5"/>
                <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"/>
              </svg>
            ), label: "Hours", value: "Mon–Fri", note: "9:00am – 6:00pm GMT" },
          ].map(({ icon, label, value, note }) => (
            <div key={label} style={{
              padding: "18px 20px", background: "var(--surface)",
              border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: "1.1rem", marginBottom: 10, color: "var(--warm-gray)", display: "flex" }}>{icon}</div>
              <div style={{
                fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
                color: "var(--warm-gray)", fontWeight: 600, marginBottom: 4,
              }}>{label}</div>
              <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--charcoal)", marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--warm-gray)" }}>{note}</div>
            </div>
          ))}
        </div>
        

        {/* Form or success */}
        {submitted ? (
          <div style={{
            padding: "36px 28px", background: "var(--surface)",
            border: "1px solid var(--border)", textAlign: "center",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: 16 }}>✓</div>
            <p style={{
              fontFamily: "var(--font-serif)", fontSize: "1.3rem",
              fontWeight: 400, color: "var(--charcoal)", marginBottom: 10,
            }}>Message received</p>
            <p style={{ fontSize: "0.78rem", color: "var(--warm-gray)", lineHeight: 1.8, marginBottom: 24 }}>
              Thank you for reaching out, {form.name.split(" ")[0]}. We'll reply to <strong>{form.email}</strong> within one business day.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "General Inquiry", message: "" }); }}
            >
              Send another message
            </button>
          </div>
        ) : (
          <div>
            <h2 style={{
              fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 400,
              color: "var(--charcoal)", marginBottom: 22, paddingBottom: 12,
              borderBottom: "1px solid var(--border)",
            }}>
              Send a Message
            </h2>

            <div style={{ display: "grid", gap: 18 }}>
              {/* Name + Email row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Your Name *</label>
                  <input
                    style={inputStyle("name")}
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    onFocus={(e) => { e.target.style.borderColor = "var(--charcoal)"; }}
                    onBlur={(e) => { e.target.style.borderColor = errors.name ? "#C0392B" : "var(--border)"; }}
                  />
                  {errors.name && <p style={{ fontSize: "0.65rem", color: "#C0392B", marginTop: 4 }}>Please enter your name.</p>}
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input
                    style={inputStyle("email")}
                    placeholder="you@example.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    onFocus={(e) => { e.target.style.borderColor = "var(--charcoal)"; }}
                    onBlur={(e) => { e.target.style.borderColor = errors.email ? "#C0392B" : "var(--border)"; }}
                  />
                  {errors.email && <p style={{ fontSize: "0.65rem", color: "#C0392B", marginTop: 4 }}>Please enter a valid email.</p>}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label style={labelStyle}>Subject</label>
                <select
                  style={{ ...inputStyle("subject"), appearance: "none", cursor: "pointer" }}
                  value={form.subject}
                  onChange={(e) => set("subject", e.target.value)}
                >
                  {[
                    "General Inquiry",
                    "Order Issue",
                    "Return or Exchange",
                    "Product Question",
                    "Styling Advice",
                    "Press & Partnerships",
                    "Other",
                  ].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Message */}
              <div>
                <label style={labelStyle}>Message *</label>
                <textarea
                  rows={5}
                  style={{ ...inputStyle("message"), resize: "vertical", lineHeight: 1.7 }}
                  placeholder="How can we help you today?"
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  onFocus={(e) => { e.target.style.borderColor = "var(--charcoal)"; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.message ? "#C0392B" : "var(--border)"; }}
                />
                {errors.message && <p style={{ fontSize: "0.65rem", color: "#C0392B", marginTop: 4 }}>Please write a message.</p>}
              </div>

              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                style={{ opacity: busy ? 0.7 : 1, cursor: busy ? "not-allowed" : "pointer" }}
                onClick={handleSubmit}
              >
                {busy ? "Sending…" : "Send Message"}
              </button>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="legal-note" style={{ marginTop: 32 }}>
          Looking for something specific? Check our{" "}
          <span
            onClick={() => navigate("faq")}
            style={{ color: "var(--gold)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            FAQ page
          </span>{" "}
          or{" "}
          <span
            onClick={() => navigate("shipping")}
            style={{ color: "var(--gold)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Shipping &amp; Returns
          </span>{" "}
          for quick answers.
        </div>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}
