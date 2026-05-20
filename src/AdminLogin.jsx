import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase.js";
import { isOtpConfigured, sendOtp, verifyOtp } from "./lib/authOtp.js";

const C = {
  cream: "#FAF7F2",
  charcoal: "#1A1A1A",
  gold: "#C9A96E",
  warmGray: "#4F4841",
  muted: "#8E867C",
  border: "#E8E2D9",
  surface: "#FFFFFF",
  goldBg: "rgba(201,169,110,0.14)",
  error: "#C0392B",
  errorBg: "rgba(192,57,43,0.08)",
  success: "#27AE60",
  successBg: "rgba(39,174,96,0.10)",
};

const font = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Montserrat', 'DM Sans', system-ui, sans-serif",
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  background: C.cream,
  color: C.charcoal,
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  fontSize: 16,
  fontFamily: font.sans,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: C.warmGray,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  marginBottom: 8,
  display: "block",
};

const btnPrimary = {
  padding: "14px 24px",
  background: C.gold,
  border: "none",
  borderRadius: 4,
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: font.sans,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const btnGhost = {
  padding: "12px 18px",
  background: "transparent",
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  color: C.warmGray,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: font.sans,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
};

function PasswordToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}
      style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: C.muted,
        padding: 6,
        display: "flex",
      }}
    >
      {show ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c5 0 9.3 3 11 7a11.6 11.6 0 0 1-2.1 3.4M6.7 6.7A11.3 11.3 0 0 0 1 12c1.7 4 6 7 11 7 1.1 0 2.2-.2 3.2-.5" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

export default function AdminLogin({ storefrontUrl, busy, msg, setMsg, email, password, setEmail, setPassword, onLogin, onCreateAccount }) {
  const [showPass, setShowPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [view, setView] = useState("login");
  const [otp, setOtp] = useState("");
  const [localBusy, setLocalBusy] = useState(false);
  const [info, setInfo] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regKey, setRegKey] = useState("");

  const clearMsgs = () => {
    setMsg("");
    setInfo("");
  };

  const handleRegister = async () => {
    clearMsgs();
    const name = regName.trim();
    const em = regEmail.trim().toLowerCase();
    if (!name) { setMsg("Full name is required."); return; }
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setMsg("Enter a valid email address."); return; }
    if (regPassword.length < 8) { setMsg("Password must be at least 8 characters."); return; }
    if (regPassword !== regConfirm) { setMsg("Passwords do not match."); return; }
    if (!regKey.trim()) { setMsg("Admin secret key is required."); return; }
    setLocalBusy(true);
    try {
      await onCreateAccount({ name, email: em, password: regPassword, secretKey: regKey.trim() });
      setRegName(""); setRegEmail(""); setRegPassword(""); setRegConfirm(""); setRegKey("");
      setView("login");
      setInfo("Admin account created! You can now sign in.");
    } catch (e) {
      setMsg(e?.message || "Could not create account. Try again.");
    } finally {
      setLocalBusy(false);
    }
  };

  const normalizedEmail = () => email.trim().toLowerCase();
  const working = busy || localBusy;
  const banner = msg || info;
  const bannerIsErr = Boolean(msg);

  const sendResetOtp = async () => {
    clearMsgs();
    const em = normalizedEmail();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setMsg("Enter a valid email address first.");
      return;
    }
    setLocalBusy(true);
    try {
      if (isOtpConfigured()) {
        await sendOtp({ email: em, purpose: "password_reset" });
        setOtp("");
        setView("forgot-otp");
        setInfo(`We sent a 6-digit code to ${em}.`);
      } else {
        await sendPasswordResetEmail(auth, em, { url: `${window.location.origin}/` });
        setView("forgot-done");
        setInfo("Password reset link sent. Check your inbox (and spam folder).");
      }
    } catch (e) {
      setMsg(e?.message || "Could not send reset code. Try again.");
    } finally {
      setLocalBusy(false);
    }
  };

  const verifyResetOtp = async () => {
    clearMsgs();
    const em = normalizedEmail();
    const code = otp.replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) {
      setMsg("Enter the 6-digit code from your email.");
      return;
    }
    setLocalBusy(true);
    try {
      await verifyOtp({ email: em, code, purpose: "password_reset" });
      await sendPasswordResetEmail(auth, em, { url: `${window.location.origin}/` });
      setView("forgot-done");
      setInfo("Code verified. We also sent a password reset link to your email.");
    } catch (e) {
      setMsg(e?.message || "Invalid or expired code. Try again or resend.");
    } finally {
      setLocalBusy(false);
    }
  };

  const bannerStyle = {
    margin: "18px 0 0",
    padding: "12px 16px",
    borderRadius: 4,
    fontSize: 14,
    lineHeight: 1.5,
    background: bannerIsErr ? C.errorBg : C.successBg,
    color: bannerIsErr ? C.error : C.success,
  };

  return (
    <div className="adm-login-page" style={{ minHeight: "100vh", background: C.cream, fontFamily: font.sans, position: "relative", overflow: "hidden" }}>
      <div className="adm-login-pattern" aria-hidden />
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div
          className="adm-login-card"
          style={{
            width: "100%",
            maxWidth: 520,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: "clamp(36px, 5vw, 56px) clamp(28px, 4vw, 48px)",
            boxShadow: "0 24px 64px rgba(26,26,26,0.08), 0 4px 16px rgba(26,26,26,0.04)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: `1px solid ${C.border}`,
                background: C.goldBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 26,
                color: C.gold,
              }}
            >
              ✦
            </div>
            <h1 style={{ margin: "0 0 8px", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 400, fontFamily: font.serif, color: C.charcoal, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Sanj<span style={{ color: C.gold }}>iiiii</span>
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: C.muted, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>
              {view === "register" ? "Create Admin Account" : view === "forgot-done" ? "Check your email" : view.startsWith("forgot") ? "Reset password" : "Admin Portal"}
            </p>
          </div>

          {/* Tab switcher */}
          {(view === "login" || view === "register") && (
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
              {["login", "register"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { clearMsgs(); setView(v); }}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    borderBottom: view === v ? `2px solid ${C.gold}` : "2px solid transparent",
                    padding: "10px 0",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: font.sans,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: view === v ? C.gold : C.muted,
                    cursor: "pointer",
                    transition: "color 0.2s, border-color 0.2s",
                    marginBottom: -1,
                  }}
                >
                  {v === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {view === "login" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={labelStyle}>Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onLogin()}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPass ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && onLogin()}
                      style={{ ...inputStyle, paddingRight: 48 }}
                    />
                    <PasswordToggle show={showPass} onToggle={() => setShowPass((v) => !v)} />
                  </div>
                </div>
                <div style={{ textAlign: "right", marginTop: -6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      clearMsgs();
                      setView("forgot-email");
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.gold, fontWeight: 600, fontSize: 13, textDecoration: "underline", fontFamily: font.sans }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              {banner && <p style={bannerStyle}>{banner}</p>}
              <button type="button" disabled={working} onClick={onLogin} style={{ ...btnPrimary, width: "100%", marginTop: 22, opacity: working ? 0.75 : 1, cursor: working ? "wait" : "pointer" }}>
                {working ? "Signing in…" : "Sign In"}
              </button>
            </>
          )}

          {view === "forgot-email" && (
            <>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: C.warmGray, lineHeight: 1.65, textAlign: "center" }}>
                Enter your admin email. We will send a verification code{isOtpConfigured() ? "" : " and a reset link"}.
              </p>
              <div>
                <label style={labelStyle}>Email address</label>
                <input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendResetOtp()} style={inputStyle} />
              </div>
              {banner && <p style={{ ...bannerStyle, margin: "16px 0 0" }}>{banner}</p>}
              <button type="button" disabled={working} onClick={sendResetOtp} style={{ ...btnPrimary, width: "100%", marginTop: 20, opacity: working ? 0.75 : 1 }}>
                {working ? "Sending…" : isOtpConfigured() ? "Send verification code" : "Send reset link"}
              </button>
              <button type="button" onClick={() => { clearMsgs(); setView("login"); }} style={{ ...btnGhost, width: "100%", marginTop: 12 }}>
                Back to sign in
              </button>
            </>
          )}

          {view === "forgot-otp" && (
            <>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: C.warmGray, lineHeight: 1.65, textAlign: "center" }}>
                Enter the 6-digit code sent to <strong style={{ color: C.charcoal }}>{normalizedEmail()}</strong>.
              </p>
              <label style={labelStyle}>Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && verifyResetOtp()}
                style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.35em", fontSize: 22, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
              />
              {banner && <p style={{ ...bannerStyle, margin: "16px 0 0" }}>{banner}</p>}
              <button type="button" disabled={working} onClick={verifyResetOtp} style={{ ...btnPrimary, width: "100%", marginTop: 20, opacity: working ? 0.75 : 1 }}>
                {working ? "Verifying…" : "Verify code"}
              </button>
              <button type="button" disabled={working} onClick={sendResetOtp} style={{ ...btnGhost, width: "100%", marginTop: 10 }}>
                Resend code
              </button>
              <button type="button" onClick={() => { clearMsgs(); setView("login"); }} style={{ ...btnGhost, width: "100%", marginTop: 8, border: "none" }}>
                Back to sign in
              </button>
            </>
          )}

          {view === "forgot-done" && (
            <>
              <p style={{ margin: "0 0 24px", fontSize: 15, color: C.warmGray, lineHeight: 1.7, textAlign: "center" }}>
                {info || "Check your email to finish resetting your password."}
              </p>
              <button type="button" onClick={() => { clearMsgs(); setView("login"); }} style={{ ...btnPrimary, width: "100%" }}>
                Back to sign in
              </button>
            </>
          )}

          <a href={storefrontUrl} style={{ display: "block", textAlign: "center", marginTop: 28, color: C.muted, fontSize: 13, textDecoration: "none" }}>
            ← Back to storefront
          </a>
        </div>
      </div>
      <style>{`
        .adm-login-pattern {
          position: absolute; inset: 0; opacity: 0.35;
          background-image: repeating-linear-gradient(45deg, ${C.gold} 0, ${C.gold} 1px, transparent 0, transparent 50%);
          background-size: 24px 24px; pointer-events: none;
        }
        .adm-login-card input::placeholder { color: ${C.muted}; opacity: 1; }
      `}</style>
    </div>
  );
}