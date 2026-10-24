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

// Admins are listed by user _id in the ADMIN_USER_IDS env var (comma separated)
const isAdmin = (context) => {
  if (!context.user) {
    return false;
  }
  const adminIds = (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return adminIds.includes(String(context.user._id));
};

// Throws unless a logged in user made the request; returns that user's _id
const requireUser = (context) => {
  if (!context.user) {
    throw AuthenticationError;
  }
  return String(context.user._id);
};

// Throws unless the logged in user is ownerId or an admin
const requireSelfOrAdmin = (context, ownerId) => {
  const userId = requireUser(context);
  if (String(ownerId) !== userId && !isAdmin(context)) {
    throw ForbiddenError;
  }
  return userId;
};

const requireAdmin = (context) => {
  requireUser(context);
  if (!isAdmin(context)) {
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
