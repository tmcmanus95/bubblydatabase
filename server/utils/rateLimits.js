const { parse } = require("graphql");
const { rateLimit } = require("express-rate-limit");

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Requests per IP. The global limit is generous because the home page still sends one query per
// product (until P1-22 batches them); the per-mutation limits guard logins, emails and spam.
const DEFAULT_LIMITS = {
  global: { windowMs: 15 * MINUTE, limit: 1500 },
  mutations: {
    login: { windowMs: 15 * MINUTE, limit: 10 },
    addUser: { windowMs: HOUR, limit: 5 },
    forgotPassword: { windowMs: HOUR, limit: 5 },
    resendEmailVerification: { windowMs: HOUR, limit: 5 },
    resetPassword: { windowMs: HOUR, limit: 10 },
    addRating: { windowMs: 15 * MINUTE, limit: 60 },
    editRating: { windowMs: 15 * MINUTE, limit: 60 },
    addReview: { windowMs: HOUR, limit: 10 },
  },
};

// Same shape as a GraphQL error so the client's error handling shows the message
const reject = (res, status, message, code) =>
  res.status(status).json({ errors: [{ message, extensions: { code } }] });

// Counts the mutation fields a request actually calls (aliases included). Uses the parsed query, not the
// client-supplied operationName, which anyone can change.
const mutationFieldCounts = (body) => {
  const counts = {};
  if (!body || typeof body.query !== "string") return counts;
  let document;
  try {
    document = parse(body.query);
  } catch {
    return counts; // Apollo rejects invalid queries itself
  }
  for (const definition of document.definitions) {
    if (definition.kind !== "OperationDefinition" || definition.operation !== "mutation") continue;
    for (const selection of definition.selectionSet.selections) {
      if (selection.kind === "Field") counts[selection.name.value] = (counts[selection.name.value] || 0) + 1;
    }
  }
  return counts;
};

const limiter = ({ windowMs, limit }, options) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) => reject(res, 429, "Too many requests. Please wait a bit and try again.", "RATE_LIMITED"),
    ...options,
  });

// Middleware for /graphql, after express.json(). Pass `false` to turn limiting off (tests).
const graphqlRateLimits = (limits = DEFAULT_LIMITS) => {
  if (limits === false) return [];
  const limited = Object.keys(limits.mutations);
  const perMutation = limited.map((name) =>
    limiter(limits.mutations[name], { skip: (req) => !req.mutationFields[name] })
  );
  return [
    limiter(limits.global),
    (req, res, next) => {
      req.mutationFields = mutationFieldCounts(req.body);
      // One attempt per request: aliases (`a: login(...) b: login(...)`) would otherwise multiply guesses
      if (limited.some((name) => req.mutationFields[name] > 1)) {
        return reject(res, 400, "Only one of each of these operations per request.", "BAD_REQUEST");
      }
      next();
    },
    ...perMutation,
  ];
};

module.exports = { graphqlRateLimits, mutationFieldCounts, DEFAULT_LIMITS };
