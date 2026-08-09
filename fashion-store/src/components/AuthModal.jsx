import { auth } from "../firebase.js";
import { sendPasswordResetEmail } from "firebase/auth";
import { LS } from "../utils/localStorage.js";
import { sendOtp as sendRegistrationOtp, verifyOtp as verifyRegistrationOtp } from "../lib/authOtp.js";
import { useState, useEffect, useRef } from "react";
import { getPasswordChecks, isPasswordAcceptable, passwordStrengthCount } from "../utils/userUtils.js";
import { COUNTRY_OPTIONS } from "../constants/countries.js";

// ─── Auth Modal ───────────────────────────────────────────────────────────────
export default function AuthModal({ mode, setMode, onClose, onSubmit, onGoogle, googleBusy, addToast }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [registerStep, setRegisterStep] = useState("form");
  const [otpValue, setOtpValue] = useState("");
  const pendingRef = useRef(null);

  useEffect(() => {
    setRegisterStep("form");
    setOtpValue("");
    pendingRef.current = null;
    setError("");
    setForm({ username: "", email: "", password: "" });
  }, [mode]);

  const resetModeSwitch = (next) => {
    setMode(next);
  };

  const passOk = isPasswordAcceptable(form.password);
  const strengthHint = mode === "register" && form.password.length > 0 && !passOk;

  const startRegisterOtp = async () => {
    setError("");
    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();
    if (!username) {
      setError("Please enter a username.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (!form.password) {
      setError("Please enter a password.");
      return;
    }
    if (!isPasswordAcceptable(form.password)) {
      setError("Password is not strong enough.");
      return;
    }
    if (LS.getUser(email)) {
      setError("Email already registered.");
      return;
    }
    try {
      setLoading(true);
      await sendRegistrationOtp({ email, purpose: "register" });
      pendingRef.current = { firstName: username, lastName: "", email, password: form.password };
      setOtpValue("");
      setRegisterStep("otp");
      addToast?.("Verification code sent to your email.", "success");
    } catch (e) {
      setError(e?.message || "Could not send verification code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    setError("");
    const entered = otpValue.replace(/\D/g, "").slice(0, 6);
    if (entered.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    const p = pendingRef.current;
    if (!p) {
      setError("Session expired. Please start again.");
      setRegisterStep("form");
      return;
    }
    try {
      setLoading(true);
      await verifyRegistrationOtp({ email: p.email, code: entered, purpose: "register" });
      const err = await Promise.resolve(onSubmit({
        email: p.email,
        password: p.password,
        firstName: p.firstName,
        lastName: p.lastName,
      }));
      if (err) {
        setError(err);
        setRegisterStep("form");
      }
    } catch (e) {
      setError(e?.message || "Invalid code. Try again or resend.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setLoading(true);
      await sendRegistrationOtp({ email: form.email.trim().toLowerCase(), purpose: "register" });
      addToast?.("A new verification code has been sent.", "info");
      setError("");
    } catch (e) {
      setError(e?.message || "Could not resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = () => {
    setError("");
    const email = form.email.trim().toLowerCase();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    if (!form.password) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    const err = onSubmit({ email, password: form.password, firstName: "", lastName: "" });
    setLoading(false);
    if (err) setError(err);
  };

  const forgotPassword = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email) {
      setError("Enter your email first so we know where to send the link.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}${window.location.pathname}`,
      });
      addToast?.("Recovery link sent. Check your inbox to reset your password.", "info");
      setError("");
    } catch (e) {
      addToast?.(e?.message || "Could not send recovery email. Try again later.", "error");
    }
  };

  return (
    <div className="modal">
      <div className="auth-modal-inner">
        {mode === "register" && registerStep === "otp" && (
          <div className="auth-otp-layer">
            <button
              type="button"
              className="close-btn"
              style={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => {
                setRegisterStep("form");
                setOtpValue("");
                setError("");
              }}
              aria-label="Close verification"
            >
              ✕
            </button>
            <div className="auth-otp-title">Verify your email</div>
            <p className="auth-otp-sub">
              Enter the 6-digit code we sent to <strong>{form.email.trim()}</strong>.
            </p>
            <input
              className="auth-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
            <button type="button" className="form-submit" onClick={verifyOtpAndRegister} disabled={loading}>
              {loading ? "Please wait…" : "Verify & create account"}
            </button>
            <button type="button" className="filter-btn" style={{ marginTop: 12, width: "100%" }} onClick={resendOtp}>
              Resend code
            </button>
          </div>
        )}

        <div className="modal-header">
          <div className="modal-title" style={{ fontWeight: 600 }}>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </div>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: "0.72rem", color: "var(--warm-gray)", marginBottom: 22, letterSpacing: "0.04em", lineHeight: 1.55 }}>
            {mode === "login"
              ? "Sign in with email and password, or continue with Google or Apple."
              : "Pick a username, email, and password. After you continue, enter the 6-digit code sent to your email."}
          </p>

          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                className="form-input"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              className="form-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <div style={{ position: "relative" }}>
              <input
                className="form-input"
                type={showPass ? "text" : "password"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLoginSubmit() : startRegisterOtp())}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--warm-gray)", fontSize: "1.1rem" }}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
            {strengthHint && <p className="form-hint-soft">Password is not strong enough.</p>}
          </div>

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: -8, marginBottom: 16 }}>
              <button type="button" onClick={forgotPassword} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold)", fontWeight: 600, fontSize: "0.72rem", textDecoration: "underline" }}>
                Forgot password?
              </button>
            </div>
          )}

          {error && registerStep === "form" && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

          {mode === "login" ? (
            <button type="button" className="form-submit" onClick={handleLoginSubmit} disabled={loading}>
              {loading ? "Please wait…" : "Sign In"}
            </button>
          ) : (
            <button
              type="button"
              className="form-submit"
              onClick={startRegisterOtp}
              disabled={!passOk || !form.username.trim() || !form.email.trim() || !form.password}
            >
              Create Account
            </button>
          )}

          <div className="auth-divider">or</div>

          <div className="social-login-grid">
            <button type="button" className="btn-social" disabled={googleBusy} onClick={() => void onGoogle?.()}>
              <span className="social-icon">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </span>
              {googleBusy ? "Connecting…" : "Continue with Google"}
            </button>
            <button type="button" className="btn-social" onClick={() => addToast?.("Apple login is coming soon!", "info")}>
              <span className="social-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M17.05 20.28c-.96.95-2.04 1.9-3.32 1.9-1.25 0-1.74-.78-3.19-.78-1.47 0-1.99.76-3.21.78-1.28.02-2.48-1.04-3.44-2.02-1.97-2.01-3.48-5.69-1.46-8.79 1-1.54 2.82-2.52 4.41-2.55 1.2-.02 2.33.72 3.07.72s1.9-.76 3.32-.62c.59.03 2.26.22 3.33 1.65-.09.05-1.99 1.05-1.97 3.34.02 2.76 2.65 3.73 2.7 3.75-.02.08-.43 1.34-1.24 2.61zM12.03 7.25c-.02-2.24 1.83-4.14 4.02-4.25.02.22.04.44.04.67 0 2.12-1.89 4.19-4.06 3.58z" />
                </svg>
              </span>
              Continue with Apple
            </button>
          </div>
          <div className="auth-switch">
            {mode === "login"
              ? <>New to sanjiiiii? <button type="button" onClick={() => resetModeSwitch("register")}>Create an account</button></>
              : <>Already a member? <button type="button" onClick={() => resetModeSwitch("login")}>Sign in</button></>}
          </div>
          <p style={{ fontSize: "0.65rem", color: "var(--warm-gray)", marginTop: 18, lineHeight: 1.55 }}>
            Password accounts are stored in this browser&apos;s localStorage. Google sign-in uses Firebase in the cloud.
          </p>
        </div>
      </div>
    </div>
  );
}

