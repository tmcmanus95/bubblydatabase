const { GraphQLError } = require("graphql");

// Rating abuse controls (P1-18). Rating no longer needs a verified email (P1-17), so these keep throwaway
// accounts from flooding scores. Thresholds live here; DECISIONS.md explains them.
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const RATING_RULES = {
  windowMs: HOUR,
  maxPerWindow: 120, // ratings + rating edits per account per hour
  newAccountMaxPerWindow: 30, // the same for accounts younger than newAccountAgeMs
  newAccountAgeMs: DAY,
  trustedAgeMs: 7 * DAY, // unverified accounts count toward leaderboards after this long
};

// When an account was created: ObjectIds carry their creation time, so no extra field is needed
const accountCreatedAt = (userId) => {
  try {
    return require("mongoose").Types.ObjectId.createFromHexString(String(userId)).getTimestamp().getTime();
  } catch {
    return Date.now();
  }
};

// Whether a user's ratings should count in leaderboards, "controversial" lists and similar rankings (used
// from Phase 2 on): verified accounts, or accounts at least trustedAgeMs old.
const trustedForAggregates = (user, now = Date.now()) =>
  Boolean(user && (user.isVerified || now - accountCreatedAt(user._id) >= RATING_RULES.trustedAgeMs));

// Per-account sliding window, in memory (one Render instance; a restart forgets)
const createRatingLimiter = (rules = RATING_RULES, now = Date.now) => {
  const hits = new Map(); // userId -> [timestamps]
  const check = (userId) => {
    const t = now();
    const recent = (hits.get(String(userId)) || []).filter((x) => x > t - rules.windowMs);
    const isNew = t - accountCreatedAt(userId) < rules.newAccountAgeMs;
    const max = isNew ? rules.newAccountMaxPerWindow : rules.maxPerWindow;
    if (recent.length >= max) {
      hits.set(String(userId), recent);
      const waitMin = Math.max(1, Math.ceil((recent[0] + rules.windowMs - t) / 60000));
      throw new GraphQLError(`You're rating very fast. Take a breather and try again in ${waitMin} minute${waitMin === 1 ? "" : "s"}.`, {
        extensions: { code: "RATE_LIMITED" },
      });
    }
    recent.push(t);
    hits.set(String(userId), recent);
  };
  return { check, reset: () => hits.clear() };
};

const ratingLimiter = createRatingLimiter();

module.exports = { RATING_RULES, trustedForAggregates, accountCreatedAt, createRatingLimiter, ratingLimiter };
