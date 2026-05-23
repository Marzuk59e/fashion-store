const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || "sanjiiiii-ee9b7";
const REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1";

function cloudFunctionUrl(name) {
  return `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${name}`;
}

function defaultEndpoints() {
  if (typeof window !== "undefined" && import.meta.env.PROD) {
    const origin = window.location.origin;
    return {
      send: `${origin}/api/send-registration-otp`,
      verify: `${origin}/api/verify-registration-otp`,
    };
  }
  return {
    send: cloudFunctionUrl("sendRegistrationOtp"),
    verify: cloudFunctionUrl("verifyRegistrationOtp"),
  };
}

const defaults = defaultEndpoints();
const OTP_SEND_ENDPOINT = import.meta.env.VITE_OTP_SEND_ENDPOINT || defaults.send;
const OTP_VERIFY_ENDPOINT = import.meta.env.VITE_OTP_VERIFY_ENDPOINT || defaults.verify;

async function postJson(url, payload) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
  } catch {
    throw new Error("Could not reach the verification service. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || "Request failed.";
    if (res.status === 404) {
      throw new Error(
        "Email verification is not set up on the server yet. Use Continue with Google, or ask the site owner to configure SMTP on Vercel.",
      );
    }
    throw new Error(msg);
  }
  return data;
}

export function isOtpConfigured() {
  return Boolean(OTP_SEND_ENDPOINT && OTP_VERIFY_ENDPOINT);
}

export async function sendOtp(payload) {
  if (!OTP_SEND_ENDPOINT) {
    throw new Error(
      "Email verification is not configured. Set VITE_OTP_SEND_ENDPOINT or deploy the /api OTP routes on Vercel.",
    );
  }
  return postJson(OTP_SEND_ENDPOINT, payload);
}

export async function verifyOtp(payload) {
  if (!OTP_VERIFY_ENDPOINT) {
    throw new Error("Email verification is not configured.");
  }
  return postJson(OTP_VERIFY_ENDPOINT, payload);
}
