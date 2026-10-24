import { useEffect, useRef } from "react";

// Cloudflare Turnstile "verify you're human" widget (P1-8). Shown only when the site key is set at build
// time (VITE_TURNSTILE_SITE_KEY on Render); otherwise renders nothing and signup works without it.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise;
const loadScript = () => {
  scriptPromise ||= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return scriptPromise;
};

export const turnstileEnabled = Boolean(SITE_KEY);

export default function Turnstile({ onToken }) {
  const box = useRef(null);
  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let widgetId;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current) return;
        widgetId = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch(() => onToken(""));
    return () => {
      cancelled = true;
      if (widgetId !== undefined) window.turnstile?.remove(widgetId);
    };
  }, [onToken]);
  return SITE_KEY ? <div ref={box} className="my-3 flex justify-center" /> : null;
}
