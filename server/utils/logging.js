const crypto = require("crypto");
const pino = require("pino");
const pinoHttp = require("pino-http");
const { unwrapResolverError } = require("@apollo/server/errors");

// Request logging and error masking (P1-9). One JSON line per request (Render keeps them in its log view):
// method, path, status, time, a request id, and the GraphQL operation name. Never logged: cookies,
// Authorization headers, Set-Cookie, request bodies (passwords, tokens, reviews) or variables.
const REDACT = ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'];

// `destination`: where lines go (default stdout; tests capture them)
const createLogger = (options = {}, destination) =>
  pino({ level: process.env.LOG_LEVEL || "info", redact: { paths: REDACT, censor: "[redacted]" }, ...options }, destination);

const requestLogger = (logger) =>
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = crypto.randomUUID();
      res.setHeader("X-Request-Id", id);
      return id;
    },
    customProps: (req) => (req.body && typeof req.body.operationName === "string" ? { operation: req.body.operationName.slice(0, 80) } : {}),
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url.split("?")[0], headers: { "user-agent": req.headers["user-agent"] } }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  });

// Error codes whose messages are meant for people (validation, auth, limits) or come from GraphQL itself
const PUBLIC_CODES = new Set([
  "BAD_USER_INPUT",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "TOO_MANY_ATTEMPTS",
  "RATE_LIMITED",
  "BAD_REQUEST",
  "GRAPHQL_PARSE_FAILED",
  "GRAPHQL_VALIDATION_FAILED",
  "PERSISTED_QUERY_NOT_FOUND",
  "PERSISTED_QUERY_NOT_SUPPORTED",
  "OPERATION_RESOLUTION_FAILURE",
]);

// Apollo formatError: in production, messages our resolvers wrote on purpose (`throw new Error("Rating not
// found")`) and public codes pass through; anything else (crashes, database errors) becomes a generic
// message with a reference that matches the logged error.
const createFormatError = ({ logger, mask }) => (formatted, error) => {
  const original = unwrapResolverError(error);
  const code = formatted.extensions && formatted.extensions.code;
  const ours = original && original.constructor === Error;
  if (!mask || PUBLIC_CODES.has(code) || ours) return formatted;
  const ref = crypto.randomUUID().slice(0, 8);
  logger.error({ ref, err: original, path: formatted.path }, "GraphQL error hidden from the client");
  return { message: `Something went wrong. Please try again. (ref ${ref})`, path: formatted.path, extensions: { code: "INTERNAL_SERVER_ERROR", ref } };
};

module.exports = { createLogger, requestLogger, createFormatError, PUBLIC_CODES };
