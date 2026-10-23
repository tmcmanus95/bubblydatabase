// Turns away request bodies with keys that start with "$" or contain "." anywhere (express-mongo-sanitize's
// check). GraphQL's own types already stop these reaching resolvers as arguments; this also covers
// anything else in the body, such as the auth token field.
const isOperatorKey = (key) => key.startsWith("$") || key.includes(".");

const hasOperatorKey = (value, depth = 0) => {
  if (depth > 20 || value === null || typeof value !== "object") return false;
  return Object.keys(value).some((key) => isOperatorKey(key) || hasOperatorKey(value[key], depth + 1));
};

const rejectOperatorKeys = (req, res, next) => {
  if (hasOperatorKey(req.body) || hasOperatorKey(req.query)) {
    return res.status(400).json({ errors: [{ message: "Invalid request.", extensions: { code: "BAD_REQUEST" } }] });
  }
  next();
};

module.exports = { rejectOperatorKeys, hasOperatorKey };
