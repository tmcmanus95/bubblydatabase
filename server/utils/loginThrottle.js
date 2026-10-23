const { GraphQLError } = require("graphql");

// Slows down password guessing (P1-4). Failed logins are counted per account + IP, and per account across
// all IPs (a higher bar, for guessing spread over many addresses). After a few failures each new attempt
// must wait longer (1s, 2s, 4s, ...), and past a limit the login is locked for a while. Counts live in
// memory: fine for one Render instance; a restart simply forgets them.
//
// Unknown emails are counted exactly like real ones and get the same messages, so the responses never
// reveal whether an account exists.

const MINUTE = 60 * 1000;
const DEFAULTS = {
  windowMs: 15 * MINUTE, // failures older than this are forgotten
  freeAttempts: 5, // failures allowed before any delay
  maxDelayMs: 60 * 1000,
  lockAfter: 10, // failures (per account + IP) that trigger a lock
  lockAfterAnyIp: 30, // failures (per account, all IPs) that trigger a lock
  lockMs: 15 * MINUTE,
};

const tooMany = (waitMs) => {
  const seconds = Math.ceil(waitMs / 1000);
  const wait = seconds >= 90 ? `${Math.ceil(seconds / 60)} minutes` : `${seconds} second${seconds === 1 ? "" : "s"}`;
  return new GraphQLError(`Too many login attempts. Try again in ${wait}.`, {
    extensions: { code: "TOO_MANY_ATTEMPTS", retryAfterSeconds: seconds },
  });
};

const createLoginThrottle = (options = {}) => {
  const settings = { ...DEFAULTS, ...options };
  const now = settings.now || Date.now;
  const entries = new Map(); // key -> { failures: [timestamps], lockedUntil }

  const entry = (key) => {
    let e = entries.get(key);
    if (!e) {
      e = { failures: [], lockedUntil: 0 };
      entries.set(key, e);
    }
    const cutoff = now() - settings.windowMs;
    e.failures = e.failures.filter((t) => t > cutoff);
    return e;
  };
  const keysFor = (email, ip) => {
    const account = `acct:${String(email).trim().toLowerCase()}`;
    return { pair: `${account}|ip:${ip}`, account };
  };

  // Throws TOO_MANY_ATTEMPTS if this account + IP must wait; call before checking the password
  const check = (email, ip) => {
    const { pair, account } = keysFor(email, ip);
    const t = now();
    for (const e of [entry(pair), entry(account)]) {
      if (e.lockedUntil > t) throw tooMany(e.lockedUntil - t);
    }
    const e = entry(pair);
    const extra = e.failures.length - settings.freeAttempts;
    if (extra >= 0) {
      const delay = Math.min(settings.maxDelayMs, 1000 * 2 ** extra);
      const readyAt = e.failures[e.failures.length - 1] + delay;
      if (readyAt > t) throw tooMany(readyAt - t);
    }
  };

  const fail = (email, ip) => {
    const { pair, account } = keysFor(email, ip);
    const t = now();
    const p = entry(pair);
    const a = entry(account);
    p.failures.push(t);
    a.failures.push(t);
    if (p.failures.length >= settings.lockAfter) p.lockedUntil = t + settings.lockMs;
    if (a.failures.length >= settings.lockAfterAnyIp) a.lockedUntil = t + settings.lockMs;
  };

  // A correct password clears this IP's count for the account (the all-IP count keeps running)
  const succeed = (email, ip) => {
    entries.delete(keysFor(email, ip).pair);
  };

  // Drops entries with nothing left to remember, so memory stays small
  const sweep = () => {
    const t = now();
    for (const [key, e] of entries) {
      if (e.lockedUntil <= t && entry(key).failures.length === 0) entries.delete(key);
    }
  };

  return { check, fail, succeed, sweep, size: () => entries.size, reset: () => entries.clear() };
};

const loginThrottle = createLoginThrottle();
setInterval(loginThrottle.sweep, 5 * MINUTE).unref();

module.exports = { loginThrottle, createLoginThrottle };
