import crypto from "node:crypto";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

const otpHashSecret = defineSecret("OTP_HASH_SECRET");
const smtpHost = defineSecret("SMTP_HOST");
const smtpPort = defineSecret("SMTP_PORT");
const smtpUser = defineSecret("SMTP_USER");
const smtpPass = defineSecret("SMTP_PASS");
const otpFromEmail = defineSecret("OTP_FROM_EMAIL");
const otpFromName = defineSecret("OTP_FROM_NAME");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(res, status, payload) {
  res.status(status).set(corsHeaders).json(payload);
}

function readJsonBody(req) {
  if (typeof req.body === "object" && req.body) return req.body;
  if (typeof req.body === "string" && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function maskEmail(email) {
  const [left, right] = String(email || "").split("@");
  if (!left || !right) return "***";
  const visible = left.length <= 2 ? left[0] : left.slice(0, 2);
  return `${visible}***@${right}`;
}

function otpHash(email, purpose, code, secret) {
  const raw = `${normalizeEmail(email)}|${purpose}|${code}`;
  return crypto.createHmac("sha256", secret).update(raw).digest("hex");
}

async function getTransporter() {
  const host = smtpHost.value();
  const port = Number(smtpPort.value() || 587);
  const user = smtpUser.value();
  const pass = smtpPass.value();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export const sendRegistrationOtp = onRequest(
  {
    region: "us-central1",
    secrets: [smtpHost, smtpPort, smtpUser, smtpPass, otpFromEmail, otpFromName, otpHashSecret],
  },
  async (req, res) => {
    if (req.method === "OPTIONS") return res.status(204).set(corsHeaders).send("");
    if (req.method !== "POST") return json(res, 405, { message: "Method not allowed" });

    const body = readJsonBody(req);
    const email = normalizeEmail(body.email);
    const purpose = String(body.purpose || "register");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(res, 400, { message: "Valid email is required." });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = Date.now();
    const expiresAtMs = now + 10 * 60 * 1000;
    const otpDocId = `${purpose}_${Buffer.from(email).toString("base64url")}`;
    const hash = otpHash(email, purpose, code, otpHashSecret.value());

    await db.collection("otpCodes").doc(otpDocId).set({
      email,
      purpose,
      codeHash: hash,
      attempts: 0,
      maxAttempts: 5,
      createdAtMs: now,
      expiresAtMs,
      verified: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(expiresAtMs),
    }, { merge: true });

    try {
      const transporter = await getTransporter();
      const fromEmail = otpFromEmail.value();
      const fromName = otpFromName.value() || "Sanjiiiii";
      await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: email,
        subject: "Your verification code",
        text: `Your verification code is ${code}. This code will expire in 10 minutes.`,
        html: `<p>Your verification code is <strong style=\"font-size:20px\">${code}</strong>.</p><p>This code will expire in 10 minutes.</p>`,
      });

      return json(res, 200, {
        ok: true,
        message: `Verification code sent to ${maskEmail(email)}.`,
        expiresInSeconds: 600,
      });
    } catch (err) {
      return json(res, 500, { message: err?.message || "Failed to send OTP email." });
    }
  },
);

export const verifyRegistrationOtp = onRequest(
  {
    region: "us-central1",
    secrets: [otpHashSecret],
  },
  async (req, res) => {
    if (req.method === "OPTIONS") return res.status(204).set(corsHeaders).send("");
    if (req.method !== "POST") return json(res, 405, { message: "Method not allowed" });

    const body = readJsonBody(req);
    const email = normalizeEmail(body.email);
    const purpose = String(body.purpose || "register");
    const code = String(body.code || "").replace(/\D/g, "").slice(0, 6);

    if (!email || !code || code.length !== 6) {
      return json(res, 400, { message: "Email and 6-digit code are required." });
    }

    const otpDocId = `${purpose}_${Buffer.from(email).toString("base64url")}`;
    const otpRef = db.collection("otpCodes").doc(otpDocId);
    const snap = await otpRef.get();
    if (!snap.exists) return json(res, 400, { message: "OTP not found. Please request a new code." });

    const data = snap.data() || {};
    const attempts = Number(data.attempts || 0);
    const maxAttempts = Number(data.maxAttempts || 5);

    if (data.verified) return json(res, 200, { ok: true, alreadyVerified: true });
    if (Date.now() > Number(data.expiresAtMs || 0)) return json(res, 400, { message: "OTP expired. Please request a new code." });
    if (attempts >= maxAttempts) return json(res, 429, { message: "Too many attempts. Please request a new code." });

    const expectedHash = String(data.codeHash || "");
    const incomingHash = otpHash(email, purpose, code, otpHashSecret.value());

    if (!expectedHash || incomingHash !== expectedHash) {
      await otpRef.set({ attempts: attempts + 1, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return json(res, 400, { message: "Invalid code. Try again." });
    }

    await otpRef.set({ verified: true, verifiedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    return json(res, 200, { ok: true, verified: true });
  },
);
