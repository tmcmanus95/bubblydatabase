// Cloudflare Turnstile (P1-8): checks the token the signup page's widget produced. Only active when
// TURNSTILE_SECRET is set (Render); without it (local dev, tests) every signup passes this check.
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET);

// Resolves true only when Cloudflare confirms the token. Network trouble counts as a failure (fail closed).
const verifyTurnstile = async (token, ip) => {
  if (!turnstileEnabled()) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(5000) });
    const result = await res.json();
    return result.success === true;
  } catch (error) {
    console.error("Turnstile check failed:", error.message);
    return false;
  }
};

module.exports = { verifyTurnstile, turnstileEnabled, VERIFY_URL };
