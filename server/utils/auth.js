const { GraphQLError } = require("graphql");
const jwt = require("jsonwebtoken");

const secret = process.env.MY_SECRET;
const expiration = "8760h";

const AuthenticationError = new GraphQLError("Could not authenticate user.", {
  extensions: {
    code: "UNAUTHENTICATED",
  },
});

const ForbiddenError = new GraphQLError("Not allowed.", {
  extensions: {
    code: "FORBIDDEN",
  },
});

// Admins have role "admin" on their user document (set with scripts/setRole.js). The ADMIN_USER_IDS env var
// (comma-separated _ids) still counts too, so nobody loses access while roles are rolled out; drop it once
// every admin has the role in production. The role is read from the database (once per request), not
// from the session token, so removing someone's admin role takes effect immediately.
const isAdmin = async (context) => {
  if (!context.user) {
    return false;
  }
  const userId = String(context.user._id);
  const adminIds = (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (adminIds.includes(userId)) {
    return true;
  }
  if (context.adminChecked === undefined) {
    const { User } = require("../models");
    const user = await User.findById(userId, { role: 1 }).lean();
    context.adminChecked = Boolean(user && user.role === "admin");
  }
  return context.adminChecked;
};

// Throws unless a logged in user made the request; returns that user's _id
const requireUser = (context) => {
  if (!context.user) {
    throw AuthenticationError;
  }
  return String(context.user._id);
};

// Throws unless the logged in user is ownerId or an admin
const requireSelfOrAdmin = async (context, ownerId) => {
  const userId = requireUser(context);
  if (String(ownerId) !== userId && !(await isAdmin(context))) {
    throw ForbiddenError;
  }
  return userId;
};

// Throws unless the logged in user is an admin. Every admin/moderation resolver starts with this
// (CLAUDE.md rule 5).
const requireAdmin = async (context) => {
  requireUser(context);
  if (!(await isAdmin(context))) {
    throw ForbiddenError;
  }
};

module.exports = {
  AuthenticationError,
  ForbiddenError,
  isAdmin,
  requireUser,
  requireSelfOrAdmin,
  requireAdmin,
  // The GraphQL context is the request. utils/sessions.js has already set req.user from the session
  // cookies (or, during the grace period, an old Bearer token); resolvers use context.res for cookies.
  authMiddleware: function ({ req }) {
    return req;
  },
  signToken: function ({ email, name, _id }) {
    const payload = { email, name, _id };
    return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
  },
};
