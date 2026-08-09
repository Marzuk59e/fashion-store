import crypto from "node:crypto";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

function initAdmin() {
  if (admin.apps.length) return admin;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Server missing FIREBASE_SERVICE_ACCOUNT_JSON. Add it in Vercel → Settings → Environment Variables.",
    );
  }
  const serviceAccount = JSON.parse(raw);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin;
}

function db() {
  return initAdmin().firestore();
}

function requireSmtpEnv() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.OTP_FROM_EMAIL;
  if (!host || !user || !pass || !from) {
    throw new Error(
      "Email (SMTP) is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and OTP_FROM_EMAIL on Vercel.",
    );
  }
  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    user,
    pass,
    from,
    fromName: process.env.OTP_FROM_NAME || "sanjiiiii",
  };
}

function otpSecret() {
  const secret = process.env.OTP_HASH_SECRET;
  if (!secret) {
    throw new Error("Server missing OTP_HASH_SECRET environment variable.");
  }
  return secret;
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function maskEmail(email) {
  const [left, right] = String(email || "").split("@");
  if (!left || !right) return "***";
  const visible = left.length <= 2 ? left[0] : left.slice(0, 2);
  return `${visible}***@${right}`;
}

function otpHash(email, purpose, code) {
  const raw = `${normalizeEmail(email)}|${purpose}|${code}`;
  return crypto.createHmac("sha256", otpSecret()).update(raw).digest("hex");
}

function otpDocId(email, purpose) {
  return `${purpose}_${Buffer.from(normalizeEmail(email)).toString("base64url")}`;
}

async function getTransporter() {
  const smtp = requireSmtpEnv();
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

export async function sendOtpEmail({ email, purpose }) {
  const normalized = normalizeEmail(email);
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    const err = new Error("Valid email is required.");
    err.status = 400;
    throw err;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const now = Date.now();
  const expiresAtMs = now + 10 * 60 * 1000;
  const docId = otpDocId(normalized, purpose);
  const hash = otpHash(normalized, purpose, code);

  await db().collection("otpCodes").doc(docId).set(
    {
      email: normalized,
      purpose,
      codeHash: hash,
      attempts: 0,
      maxAttempts: 5,
      createdAtMs: now,
      expiresAtMs,
      verified: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(expiresAtMs),
    },
    { merge: true },
  );

  const smtp = requireSmtpEnv();
  const transporter = await getTransporter();
  await transporter.sendMail({
    from: `${smtp.fromName} <${smtp.from}>`,
    to: normalized,
    subject: "Your verification code",
    text: `Your verification code is ${code}. This code will expire in 10 minutes.`,
    html: `<p>Your verification code is <strong style="font-size:20px">${code}</strong>.</p><p>This code will expire in 10 minutes.</p>`,
  });

  return {
    ok: true,
    message: `Verification code sent to ${maskEmail(normalized)}.`,
    expiresInSeconds: 600,
  };
}

export async function verifyOtpCode({ email, purpose, code }) {
  const normalized = normalizeEmail(email);
  const digits = String(code || "").replace(/\D/g, "").slice(0, 6);
  if (!normalized || digits.length !== 6) {
    const err = new Error("Email and 6-digit code are required.");
    err.status = 400;
    throw err;
  }

  const docId = otpDocId(normalized, purpose);
  const otpRef = db().collection("otpCodes").doc(docId);
  const snap = await otpRef.get();
  if (!snap.exists) {
    const err = new Error("OTP not found. Please request a new code.");
    err.status = 400;
    throw err;
  }

  const data = snap.data() || {};
  const attempts = Number(data.attempts || 0);
  const maxAttempts = Number(data.maxAttempts || 5);

  if (data.verified) return { ok: true, alreadyVerified: true };
  if (Date.now() > Number(data.expiresAtMs || 0)) {
    const err = new Error("OTP expired. Please request a new code.");
    err.status = 400;
    throw err;
  }
  if (attempts >= maxAttempts) {
    const err = new Error("Too many attempts. Please request a new code.");
    err.status = 429;
    throw err;
  }

  const expectedHash = String(data.codeHash || "");
  const incomingHash = otpHash(normalized, purpose, digits);
  if (!expectedHash || incomingHash !== expectedHash) {
    await otpRef.set(
      { attempts: attempts + 1, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
    const err = new Error("Invalid code. Try again.");
    err.status = 400;
    throw err;
  }

  await otpRef.set(
    {
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true, verified: true };
}
