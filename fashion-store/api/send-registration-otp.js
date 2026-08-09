import { sendOtpEmail } from "./lib/otp-core.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req, res) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const payload = await sendOtpEmail({
      email: body.email,
      purpose: body.purpose || "register",
    });
    return res.status(200).json(payload);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err?.message || "Failed to send OTP email." });
  }
}
