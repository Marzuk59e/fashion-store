import { useState, useEffect } from "react";

export default function CookieNotice({ open, onClose, onSave, existing, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const [locked, setLocked] = useState(true);
  const [analytics, setAnalytics] = useState(Boolean(existing?.analytics));
  const [marketing, setMarketing] = useState(Boolean(existing?.marketing));

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setExpanded(false);
      setLocked(true);
      setAnalytics(Boolean(existing?.analytics));
      setMarketing(Boolean(existing?.marketing));
    });
  }, [open, existing]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [expanded]);

  if (!open) return null;

  const acceptAll = () => onSave({ necessary: true, analytics: true, marketing: true });
  const saveCustom = () => onSave({ necessary: true, analytics, marketing });

  return (
    <>
      {/* Lock page interaction until user picks Accept All or Customize. */}
      {locked && <div className="cookie-backdrop" />}
      {expanded && (
        <div
          className="cookie-modal-backdrop"
          aria-hidden="true"
          onClick={() => setExpanded(false)}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
        />
      )}
      <div
        className="cookie-panel"
        role={expanded ? undefined : "dialog"}
        aria-modal={expanded ? undefined : "true"}
        aria-hidden={expanded}
        aria-label={expanded ? undefined : "Cookie preferences"}
      >
        <div className="cookie-top">
          <div className="cookie-content">
            <div className="cookie-badge" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <clipPath id="cookieBite">
                    <path d="M0 0 H32 V32 H0 Z" />
                    <circle cx="25" cy="6" r="7" />
                  </clipPath>
                  <mask id="biteMask">
                    <rect width="32" height="32" fill="white" />
                    <circle cx="25" cy="6" r="7" fill="black" />
                  </mask>
                </defs>
                <circle cx="15" cy="17" r="13" fill="#C9A96E" mask="url(#biteMask)" />
                <circle cx="10" cy="14" r="1.5" fill="#7A5230" mask="url(#biteMask)" />
                <circle cx="16" cy="12" r="1.3" fill="#7A5230" mask="url(#biteMask)" />
                <circle cx="11" cy="21" r="1.4" fill="#7A5230" mask="url(#biteMask)" />
                <circle cx="19" cy="20" r="1.5" fill="#7A5230" mask="url(#biteMask)" />
                <circle cx="20" cy="14" r="1.2" fill="#7A5230" mask="url(#biteMask)" />
              </svg>
            </div>
            <div className="cookie-text">
              {expanded ? (
                <>
                  Optional cookies are set in the center dialog. You can still{" "}
                  <strong style={{ color: "var(--charcoal)" }}>Accept all</strong> from here, or use Back / Save in the dialog.
                </>
              ) : (
                <>
                  We use cookies to keep the site secure, improve performance, and personalize experiences. See our{" "}
                  <a onClick={() => { onClose(); navigate("privacy"); }}>Privacy Policy</a>.
                </>
              )}
            </div>
          </div>
          <div className="cookie-actions">
            {expanded ? (
              <button type="button" className="cookie-btn primary" onClick={acceptAll}>Accept All</button>
            ) : (
              <>
                <button
                  type="button"
                  className="cookie-btn ghost"
                  onClick={() => {
                    setExpanded(true);
                    setLocked(false);
                  }}
                >
                  Customize
                </button>
                <button type="button" className="cookie-btn primary" onClick={acceptAll}>Accept All</button>
              </>
            )}
          </div>
        </div>
      </div>
      {expanded && (
        <div className="cookie-modal-layer">
          <div
            className="cookie-customize-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Customize cookie categories"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cookie-modal-title">Cookie preferences</div>
            <p className="cookie-modal-lead">
              Necessary cookies are always active so the store can load, keep you signed in safely, and remember this choice.
              You can turn optional categories on or off below. See our{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  navigate("privacy");
                }}
                style={{ color: "var(--charcoal)", textDecoration: "underline", cursor: "pointer" }}
              >
                Privacy Policy
              </a>
              .
            </p>
            <div className="cookie-modal-section">
              <div className="cookie-row">
                <div>
                  <strong>Necessary</strong>
                  <div className="cookie-detail">
                    Includes cookies needed for security (for example sign-in and session integrity), fraud prevention, network
                    protection, load balancing, and remembering your consent banner choice. They do not track you for ads and
                    cannot be disabled without breaking core features like checkout or your account area.
                  </div>
                </div>
                <div className="cookie-toggle">
                  <div className="cookie-lock">Always on</div>
                </div>
              </div>
            </div>
            <div className="cookie-modal-section">
              <div className="cookie-row">
                <div>
                  <strong>Analytics</strong>
                  <div className="cookie-detail">
                    Optional. Helps us measure how visitors use the site (for example which pages load slowly, where people drop
                    off, and whether search or filters work as intended). Data is aggregated for this demo storefront to improve
                    performance and content; it is not sold. If you turn this off, we still run the shop, but we get less signal
                    for improvements.
                  </div>
                </div>
                <div className="cookie-toggle">
                  <button
                    type="button"
                    className={`cookie-switch${analytics ? " on" : ""}`}
                    onClick={() => setAnalytics((v) => !v)}
                    role="switch"
                    aria-checked={analytics}
                    aria-label="Analytics cookies"
                  />
                </div>
              </div>
            </div>
            <div className="cookie-modal-section">
              <div className="cookie-row">
                <div>
                  <strong>Marketing</strong>
                  <div className="cookie-detail">
                    Optional. Used to remember promotions, campaign links, wishlist or cart reminders, and to test which offers
                    resonate—so messaging can feel more relevant when we run campaigns. If you disable marketing cookies, you
                    may still see generic content, but personalization and attribution across channels will be limited.
                  </div>
                </div>
                <div className="cookie-toggle">
                  <button
                    type="button"
                    className={`cookie-switch${marketing ? " on" : ""}`}
                    onClick={() => setMarketing((v) => !v)}
                    role="switch"
                    aria-checked={marketing}
                    aria-label="Marketing cookies"
                  />
                </div>
              </div>
            </div>
            <div className="cookie-modal-footer">
              <button type="button" className="cookie-btn ghost" onClick={() => setExpanded(false)}>Back</button>
              <button type="button" className="cookie-btn primary" onClick={saveCustom}>Save preferences</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

