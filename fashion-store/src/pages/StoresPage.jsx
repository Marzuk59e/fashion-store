// ─── StoresPage ───────────────────────────────────────────────────────────────
const STORES = [
    {
      id: 1,
      city: "Paris",
      country: "France",
      address: "24 Rue du Faubourg Saint-Honoré, 75008 Paris",
      hours: "Mon–Sat 10:00–19:00 · Sun 12:00–17:00",
      phone: "+33 1 42 68 24 00",
      tag: "Flagship",
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.142047744172!2d2.3080!3d48.8708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66fc23e8a6bbf%3A0x6b3d15f6c8e34d1a!2sRue%20du%20Faubourg%20Saint-Honor%C3%A9%2C%20Paris!5e0!3m2!1sen!2sfr!4v1700000000000",
    },
    {
      id: 2,
      city: "London",
      country: "United Kingdom",
      address: "138 New Bond Street, Mayfair, London W1S 2TN",
      hours: "Mon–Sat 10:00–18:30 · Sun 12:00–17:00",
      phone: "+44 20 7493 2100",
      tag: "Boutique",
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2483.058!2d-0.1447!3d51.5127!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487604cfb3e68b3d%3A0x0!2sNew%20Bond%20St%2C%20London!5e0!3m2!1sen!2sgb!4v1700000000001",
    },
    {
      id: 3,
      city: "Tokyo",
      country: "Japan",
      address: "5-4-1 Minami-Aoyama, Minato City, Tokyo 107-0062",
      hours: "Mon–Sun 11:00–20:00",
      phone: "+81 3 6418 5800",
      tag: "Boutique",
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3241.87!2d139.7144!3d35.6658!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188ca2edfe4a13%3A0x0!2sMinami-Aoyama%2C%20Minato%20City%2C%20Tokyo!5e0!3m2!1sen!2sjp!4v1700000000002",
    },
    {
      id: 4,
      city: "New York",
      country: "United States",
      address: "680 Madison Avenue, Upper East Side, NY 10065",
      hours: "Mon–Sat 10:00–19:00 · Sun 12:00–18:00",
      phone: "+1 212 308 2100",
      tag: "Boutique",
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.31!2d-73.9679!3d40.7638!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c258f07b97c429%3A0x0!2sMadison%20Ave%2C%20New%20York!5e0!3m2!1sen!2sus!4v1700000000003",
    },
    {
      id: 5,
      city: "Dubai",
      country: "UAE",
      address: "Fashion Avenue, Dubai Mall, Downtown Dubai",
      hours: "Mon–Sun 10:00–22:00",
      phone: "+971 4 339 8800",
      tag: "Boutique",
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.17!2d55.2796!3d25.1972!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f682829c85fbd%3A0x0!2sDubai%20Mall!5e0!3m2!1sen!2sae!4v1700000000004",
    },
    {
      id: 6,
      city: "Milan",
      country: "Italy",
      address: "Via Montenapoleone 12, 20121 Milan",
      hours: "Mon–Sat 10:00–19:30 · Sun 11:00–17:00",
      phone: "+39 02 7600 5810",
      tag: "Boutique",
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2797.74!2d9.1945!3d45.4678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4786c6aef34b5b89%3A0x0!2sVia%20Montenapoleone%2C%20Milan!5e0!3m2!1sen!2sit!4v1700000000005",
    },
  ];
  
  import { useState } from "react";
  
  export default function StoresPage({ navigate }) {
    const [activeStore, setActiveStore] = useState(STORES[0]);
  
    return (
      <div style={{ background: "var(--cream, #f5f0e8)", minHeight: "100vh" }}>
  
        {/* ── Hero ── */}
        <div
          style={{
            background: "var(--ink, #1a1a1a)",
            color: "#fff",
            textAlign: "center",
            padding: "80px 24px 64px",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.22em",
              color: "var(--gold, #b89b5e)",
              marginBottom: 18,
              textTransform: "uppercase",
            }}
          >
            Our World
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              fontWeight: 400,
              lineHeight: 1.1,
              margin: "0 0 20px",
            }}
          >
            Find a Store
          </h1>
          <p
            style={{
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.55)",
              maxWidth: 460,
              margin: "0 auto",
              lineHeight: 1.7,
              letterSpacing: "0.03em",
            }}
          >
            Six locations. One vision. Experience sanjiiiii in person at our boutiques across the world's fashion capitals.
          </p>
        </div>
  
        {/* ── Main Layout ── */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "60px 24px 100px",
            display: "grid",
            gridTemplateColumns: "340px 1fr",
            gap: 32,
            alignItems: "start",
          }}
          className="stores-layout"
        >
  
          {/* ── Store List ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {STORES.map((store) => {
              const isActive = activeStore.id === store.id;
              return (
                <div
                  key={store.id}
                  onClick={() => setActiveStore(store)}
                  style={{
                    background: isActive ? "var(--ink, #1a1a1a)" : "#fff",
                    color: isActive ? "#fff" : "var(--ink, #1a1a1a)",
                    border: isActive
                      ? "1px solid var(--ink, #1a1a1a)"
                      : "1px solid rgba(0,0,0,0.1)",
                    padding: "20px 22px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-serif, Georgia, serif)",
                        fontSize: "1.1rem",
                        fontWeight: 400,
                      }}
                    >
                      {store.city}
                    </div>
                    {store.tag === "Flagship" && (
                      <span
                        style={{
                          fontSize: "0.55rem",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          background: "var(--gold, #b89b5e)",
                          color: "#fff",
                          padding: "3px 8px",
                        }}
                      >
                        Flagship
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      opacity: isActive ? 0.6 : 0.5,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {store.country}
                  </div>
                  {isActive && (
                    <div style={{ marginTop: 14, fontSize: "0.72rem", opacity: 0.75, lineHeight: 1.8 }}>
                      <div>{store.address}</div>
                      <div style={{ marginTop: 4 }}>{store.hours}</div>
                      <div style={{ marginTop: 4 }}>{store.phone}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
  
          {/* ── Map + Detail ── */}
          <div>
            {/* Map */}
            <div
              style={{
                width: "100%",
                height: 420,
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.1)",
                marginBottom: 24,
              }}
            >
              <iframe
                key={activeStore.id}
                title={`Map of ${activeStore.city}`}
                src={activeStore.mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
  
            {/* Store Detail Card */}
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                padding: "28px 28px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontSize: "1.5rem",
                      fontWeight: 400,
                      marginBottom: 4,
                    }}
                  >
                    {activeStore.city}
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--gold, #b89b5e)",
                    }}
                  >
                    {activeStore.country}
                  </div>
                </div>
                {activeStore.tag === "Flagship" && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      background: "var(--gold, #b89b5e)",
                      color: "#fff",
                      padding: "5px 12px",
                    }}
                  >
                    Flagship
                  </span>
                )}
              </div>
  
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "18px 32px",
                  fontSize: "0.78rem",
                  lineHeight: 1.7,
                  color: "var(--ink, #1a1a1a)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--warm-gray, #888)",
                      marginBottom: 6,
                    }}
                  >
                    Address
                  </div>
                  <div>{activeStore.address}</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--warm-gray, #888)",
                      marginBottom: 6,
                    }}
                  >
                    Hours
                  </div>
                  <div>{activeStore.hours}</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--warm-gray, #888)",
                      marginBottom: 6,
                    }}
                  >
                    Phone
                  </div>
                  <div>{activeStore.phone}</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--warm-gray, #888)",
                      marginBottom: 6,
                    }}
                  >
                    Appointments
                  </div>
                  <div>Private styling available</div>
                </div>
              </div>
  
              <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeStore.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    background: "var(--ink, #1a1a1a)",
                    color: "#fff",
                    fontSize: "0.62rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "12px 22px",
                    textDecoration: "none",
                    transition: "opacity 0.2s",
                  }}
                >
                  Get Directions
                </a>
                <button
                  onClick={() => navigate("contact")}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--ink, #1a1a1a)",
                    color: "var(--ink, #1a1a1a)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "12px 22px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
  
        {/* ── Responsive styles ── */}
        <style>{`
          @media (max-width: 768px) {
            .stores-layout {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    );
  }