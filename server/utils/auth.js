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
  authMiddleware: function ({ req }) {
    // allows token to be sent via req.body, req.query, or headers
    let token = req.body.token || req.query.token || req.headers.authorization;

    // We split the token string into an array and return actual token
    if (req.headers.authorization) {
      token = token.split(" ").pop().trim();
    }

    if (!token) {
      return req;
    }

    // if token can be verified, add the decoded user's data to the request so it can be accessed in the resolver
    try {
      const { data } = jwt.verify(token, secret, { maxAge: expiration });
      req.user = data;
    } catch {
      console.log("Invalid token");
    }

    // return the request object so it can be passed to the resolver as `context`
    return req;
  },
  signToken: function ({ email, name, _id }) {
    const payload = { email, name, _id };
    return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
  },
};
