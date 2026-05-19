const OTP_SEND_ENDPOINT = import.meta.env.VITE_OTP_SEND_ENDPOINT || "";
const OTP_VERIFY_ENDPOINT = import.meta.env.VITE_OTP_VERIFY_ENDPOINT || "";

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Request failed.");
  return data;
}

export function isOtpConfigured() {
  return Boolean(OTP_SEND_ENDPOINT && OTP_VERIFY_ENDPOINT);
}

export async function sendOtp(payload) {
  if (!OTP_SEND_ENDPOINT) throw new Error("OTP service not configured.");
  return postJson(OTP_SEND_ENDPOINT, payload);
}

export async function verifyOtp(payload) {
  if (!OTP_VERIFY_ENDPOINT) throw new Error("OTP verification not configured.");
  return postJson(OTP_VERIFY_ENDPOINT, payload);
}
