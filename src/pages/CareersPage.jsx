import { useState } from "react";
import Footer from "../components/Footer.jsx";

const OPEN_ROLES = [
  {
    department: "Design",
    roles: [
      {
        title: "Senior Womenswear Designer",
        type: "Full-time",
        location: "Paris, France",
        description:
          "Lead seasonal design direction for our womenswear line, working directly with heritage mills and pattern-makers. 6+ years in luxury ready-to-wear required.",
      },
      {
        title: "Textile Research Specialist",
        type: "Full-time",
        location: "Remote (EU)",
        description:
          "Source and evaluate sustainable fabrics, maintain supplier certifications, and build our material library. Deep knowledge of OEKO-TEX and GOTS standards required.",
      },
    ],
  },
  {
    department: "Technology",
    roles: [
      {
        title: "Senior Frontend Engineer",
        type: "Full-time",
        location: "Remote (Anywhere)",
        description:
          "Own our customer-facing web experience — performance, accessibility, and craft. React, strong CSS fundamentals, and care for detail are essential.",
      },
      {
        title: "Data Analyst",
        type: "Full-time",
        location: "Remote (Anywhere)",
        description:
          "Build reporting infrastructure, surface inventory and demand signals, and support sustainability metric tracking. SQL fluency and a curiosity for fashion operations required.",
      },
    ],
  },
  {
    department: "Operations",
    roles: [
      {
        title: "Logistics & Fulfilment Manager",
        type: "Full-time",
        location: "London, UK",
        description:
          "Oversee relationships with our 3PL partners, manage carbon-neutral shipping programme, and improve last-mile delivery experience across 60+ countries.",
      },
    ],
  },
  {
    department: "Customer Experience",
    roles: [
      {
        title: "Customer Experience Lead",
        type: "Full-time",
        location: "Remote (Anywhere)",
        description:
          "Own the post-purchase customer relationship — returns, sizing guidance, repair support. Empathy, patience, and a love of exceptional service are non-negotiable.",
      },
    ],
  },
];

const BENEFITS = [
  { label: "Remote-First Culture", body: "Most roles are fully remote. We have offices in Paris and London for those who want them, not those who don't." },
  { label: "Meaningful Work", body: "Every project at sanjiiiii connects to sustainability, craft, or both. Your work will matter beyond the next sprint or collection." },
  { label: "Annual Wardrobe Allowance", body: "All employees receive a generous annual credit to spend across the sanjiiiii collection — wear what you help make." },
  { label: "Learning Budget", body: "£1,500 per year for courses, books, conferences, or workshops of your choosing. No approval process, no justification required." },
  { label: "Enhanced Parental Leave", body: "20 weeks fully paid parental leave for all parents, regardless of gender or employment type." },
  { label: "Transparent Pay Bands", body: "Salary bands for every role are published internally and are available on request during the application process." },
];

function RoleItem({ title, type, location, description }) {
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
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--charcoal)", lineHeight: 1.5, marginBottom: 3 }}>
            {title}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={{
              fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase",
              fontWeight: 600, color: "var(--gold)", border: "1px solid var(--gold)",
              padding: "2px 7px",
            }}>
              {type}
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--warm-gray)" }}>{location}</span>
          </div>
        </div>
        <span style={{
          fontSize: "1.2rem", color: open ? "var(--gold)" : "var(--warm-gray)",
          lineHeight: 1, flexShrink: 0, transition: "transform 0.25s, color 0.2s",
          display: "block", transform: open ? "rotate(45deg)" : "rotate(0)",
        }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 20, fontSize: "0.8rem", color: "var(--warm-gray)", lineHeight: 1.85 }}>
          <p style={{ marginBottom: 16 }}>{description}</p>
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: "0.62rem" }}
          >
            Apply for This Role
          </button>
        </div>
      )}
    </div>
  );
}

export default function CareersPage({ navigate }) {
  const [activeDept, setActiveDept] = useState(null);

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
        {/* Header */}
        <div className="legal-kicker">Join Us</div>
        <div className="legal-h1">Careers</div>
        <p className="legal-p">
          We are a small team building something we genuinely care about. If you want to do
          meaningful work at the intersection of fashion, sustainability, and craft — we would love
          to hear from you.
        </p>

        {/* Department filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          <button
            type="button"
            onClick={() => setActiveDept(null)}
            style={{
              padding: "6px 14px", fontSize: "0.7rem", letterSpacing: "0.1em",
              textTransform: "uppercase", fontWeight: 600, cursor: "pointer",
              border: "1px solid",
              borderColor: activeDept === null ? "var(--charcoal)" : "var(--border)",
              background: activeDept === null ? "var(--charcoal)" : "transparent",
              color: activeDept === null ? "var(--cream)" : "var(--warm-gray)",
              transition: "all 0.15s",
            }}
          >
            All Departments
          </button>
          {OPEN_ROLES.map((dept) => (
            <button
              key={dept.department}
              type="button"
              onClick={() => setActiveDept(activeDept === dept.department ? null : dept.department)}
              style={{
                padding: "6px 14px", fontSize: "0.7rem", letterSpacing: "0.1em",
                textTransform: "uppercase", fontWeight: 600, cursor: "pointer",
                border: "1px solid",
                borderColor: activeDept === dept.department ? "var(--charcoal)" : "var(--border)",
                background: activeDept === dept.department ? "var(--charcoal)" : "transparent",
                color: activeDept === dept.department ? "var(--cream)" : "var(--warm-gray)",
                transition: "all 0.15s",
              }}
            >
              {dept.department}
            </button>
          ))}
        </div>

        {/* Open roles */}
        {OPEN_ROLES.filter((d) => !activeDept || d.department === activeDept).map((dept) => (
          <div key={dept.department} style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 400,
              color: "var(--charcoal)", marginBottom: 4, paddingBottom: 12,
              borderBottom: "2px solid var(--charcoal)",
            }}>
              {dept.department}
            </h2>
            {dept.roles.map((role) => (
              <RoleItem key={role.title} {...role} />
            ))}
          </div>
        ))}

        {/* Benefits */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 400,
            color: "var(--charcoal)", marginBottom: 4, paddingBottom: 12,
            borderBottom: "2px solid var(--charcoal)",
          }}>
            What We Offer
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {BENEFITS.map((b, i) => (
              <div
                key={b.label}
                style={{
                  padding: "20px 18px",
                  borderBottom: i < BENEFITS.length - 2 ? "1px solid var(--border)" : "none",
                  borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{
                  fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--charcoal)", marginBottom: 6,
                }}>
                  {b.label}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--warm-gray)", lineHeight: 1.8 }}>
                  {b.body}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spontaneous CTA */}
        <div style={{
          marginTop: 8, padding: "24px 28px",
          background: "var(--surface)", border: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start",
        }}>
          <p style={{
            fontSize: "0.82rem", fontFamily: "var(--font-serif)", fontWeight: 400,
            color: "var(--charcoal)", margin: 0,
          }}>
            Don't see the right role?
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--warm-gray)", margin: 0, lineHeight: 1.7 }}>
            We occasionally hire for roles we haven't listed yet. Send a short note about yourself and what you'd like to build.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 4 }}
            onClick={() => navigate("contact")}
          >
            Get in Touch
          </button>
        </div>

        <p style={{
          marginTop: 32, fontSize: "0.7rem", color: "var(--warm-gray)",
          borderTop: "1px solid var(--border)", paddingTop: 16,
        }}>
          Last updated: June 2025 · {OPEN_ROLES.reduce((acc, d) => acc + d.roles.length, 0)} open positions
        </p>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}
