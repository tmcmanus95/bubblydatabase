const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Session } = require("../models");

// Cookie sessions (P1-6). Two httpOnly cookies, invisible to page scripts:
//   bubbly_access   a 15-minute JWT naming the user
//   bubbly_refresh  a random 30-day token; the server stores only its hash (models/Session.js)
// plus bubbly_signed_in=1, which page scripts can read to show the signed-in UI (no secret in it).
// When the access cookie is missing or expired, the refresh cookie silently gets a new pair (rotation).
// A refresh token used twice means it was copied: every session of that user is revoked.
//
// Grace period: the old 1-year tokens in localStorage (Authorization: Bearer) still work until
// BEARER_GRACE_UNTIL, and a request that uses one is upgraded to cookies on the spot, so signed-in users
// move over without logging in again. Tokens in the request body or query string are no longer read.

const ACCESS_COOKIE = "bubbly_access";
const REFRESH_COOKIE = "bubbly_refresh";
// Readable by page scripts on purpose: holds no secret ("1"), it only tells the client to show the
// signed-in UI. Lives exactly as long as the refresh cookie.
const SIGNED_IN_COOKIE = "bubbly_signed_in";
const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Concurrent requests from one page load may all present the same refresh token while it rotates
const ROTATION_RACE_MS = 30 * 1000;
const DEFAULT_BEARER_GRACE_UNTIL = "2027-01-31";

const secret = () => process.env.MY_SECRET;
const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");
const publicUser = (user) => ({ email: user.email, name: user.name || user.username, _id: String(user._id) });

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge,
});

const setAccessCookie = (res, user) => {
  const token = jwt.sign({ data: publicUser(user), use: "access" }, secret(), { expiresIn: ACCESS_TTL_MS / 1000 });
  res.cookie(ACCESS_COOKIE, token, cookieOptions(ACCESS_TTL_MS));
};

const createSession = async (res, user) => {
  const token = crypto.randomBytes(32).toString("base64url");
  const session = await Session.create({
    user: user._id,
    tokenHash: hash(token),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  res.cookie(REFRESH_COOKIE, token, cookieOptions(REFRESH_TTL_MS));
  res.cookie(SIGNED_IN_COOKIE, "1", { ...cookieOptions(REFRESH_TTL_MS), httpOnly: false });
  setAccessCookie(res, user);
  return session;
};

const clearCookies = (res) => {
  const { maxAge, ...options } = cookieOptions(0);
  res.clearCookie(ACCESS_COOKIE, options);
  res.clearCookie(REFRESH_COOKIE, options);
  res.clearCookie(SIGNED_IN_COOKIE, { ...options, httpOnly: false });
};

const readAccess = (token) => {
  try {
    const { data, use } = jwt.verify(token, secret());
    return use === "access" ? data : null;
  } catch {
    return null;
  }
};

const bearerGraceOver = () => Date.now() > Date.parse(process.env.BEARER_GRACE_UNTIL || DEFAULT_BEARER_GRACE_UNTIL);

const readBearer = (req) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || bearerGraceOver()) return null;
  try {
    const { data, use } = jwt.verify(token, secret(), { maxAge: "8760h" });
    return use ? null : data; // only the old login tokens, never a copied access cookie
  } catch {
    return null;
  }
};

// Swaps a refresh token for a new pair. Returns the user's public data, or null.
const rotate = async (req, res, token) => {
  const session = await Session.findOne({ tokenHash: hash(token) }).populate("user");
  if (!session || session.expiresAt <= new Date() || !session.user) {
    clearCookies(res);
    return null;
  }
  if (session.revokedAt) {
    if (session.replacedBy && Date.now() - session.revokedAt.getTime() < ROTATION_RACE_MS) {
      // A sibling request already rotated it; the browser gets the new cookies from that response
      return publicUser(session.user);
    }
    // Reused after rotation: someone copied it. Sign this user out everywhere.
    await Session.updateMany({ user: session.user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    clearCookies(res);
    return null;
  }
  const next = await createSession(res, session.user);
  session.revokedAt = new Date();
  session.replacedBy = next._id;
  await session.save();
  return publicUser(session.user);
};

// Express middleware for /graphql (after cookieParser): sets req.user from the session, if any
const sessionMiddleware = async (req, res, next) => {
  try {
    const access = req.cookies && req.cookies[ACCESS_COOKIE];
    const refresh = req.cookies && req.cookies[REFRESH_COOKIE];
    req.user = (access && readAccess(access)) || (refresh && (await rotate(req, res, refresh))) || null;
    if (!req.user) {
      const legacy = readBearer(req);
      if (legacy) {
        req.user = legacy;
        if (!refresh) await createSession(res, legacy); // move this browser onto cookies
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

// For resolvers: start a session after login/signup, end it on logout, end all after a password reset
const startSession = (context, user) => createSession(context.res, user);

const endSession = async (context) => {
  const refresh = context.cookies && context.cookies[REFRESH_COOKIE];
  if (refresh) await Session.updateOne({ tokenHash: hash(refresh), revokedAt: null }, { $set: { revokedAt: new Date() } });
  clearCookies(context.res);
};

const endAllSessions = (userId) => Session.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  SIGNED_IN_COOKIE,
  sessionMiddleware,
  startSession,
  endSession,
  endAllSessions,
  hash,
};
