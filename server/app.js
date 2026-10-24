const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { expressMiddleware } = require("@as-integrations/express4");
const { ApolloServer } = require("@apollo/server");
const path = require("path");
const { authMiddleware } = require("./utils/auth");
const typeDefs = require("./schemas/typeDefs");
const { graphqlRateLimits } = require("./utils/rateLimits");
const { withValidation } = require("./schemas/validation");
const { rejectOperatorKeys } = require("./utils/rejectOperatorKeys");
const cookieParser = require("cookie-parser");
const { sessionMiddleware } = require("./utils/sessions");
const mongoose = require("mongoose");
const { createLogger, requestLogger, createFormatError } = require("./utils/logging");
const { createGoRouter } = require("./routes/go");
const resolvers = require("./schemas/resolvers");

// What the built site is allowed to load. Images: only our own files and data: URIs (generated cards);
// no third-party images (CLAUDE.md rule 10). Amazon's "Where to buy" images get their own host later (P15-5).
const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    // Cloudflare Turnstile on the signup page (P1-8): its script and its iframe
    scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
    frameSrc: ["https://challenges.cloudflare.com"],
    // MUI/emotion injects <style> tags; Google Fonts serves the Lilita One stylesheet
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    imgSrc: ["'self'", "data:"],
    // The contact form posts to Formspree
    connectSrc: ["'self'", "https://formspree.io"],
    formAction: ["'self'", "https://formspree.io"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
  },
};

// Other sites allowed to call the API from a browser (comma-separated CORS_ORIGINS). Empty = only the
// site itself, which is same-origin and needs no CORS headers.
const isAllowedOrigin = (origin) =>
  (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .includes(origin);

// How many proxies sit in front of the app (TRUST_PROXY). On Render every request passes through three:
// Cloudflare, Render's load balancer, and a proxy on the same machine (measured on staging, 2026-10-23:
// X-Forwarded-For = "<visitor>, <Cloudflare>, <10.x Render>" from socket ::1). Trusting exactly three hops
// makes req.ip the visitor, which rate limits key on; anything a visitor writes into X-Forwarded-For sits
// further left and is ignored. Trusting more hops than exist would let visitors fake their IP.
const trustProxy = (isProduction) => {
  const value = process.env.TRUST_PROXY;
  if (value === undefined || value === "") return isProduction ? 3 : false;
  if (/^\d+$/.test(value)) return Number(value);
  return value === "true" ? true : value === "false" ? false : value;
};

// Builds the Express app with GraphQL mounted. Doesn't connect to MongoDB or listen on a port, so
// tests can use it with their own database. `rateLimits`: see utils/rateLimits.js (false = off);
// `logger`: a pino logger (tests pass a silent one).
const createApp = async ({ rateLimits, logger = createLogger() } = {}) => {
  const isProduction = process.env.NODE_ENV === "production";
  const app = express();
  app.set("trust proxy", trustProxy(isProduction));
  const server = new ApolloServer({
    typeDefs,
    resolvers: withValidation(resolvers),
    formatError: createFormatError({ logger, mask: isProduction }),
  });
  await server.start();

  app.use(requestLogger(logger));

  // For uptime monitors: 200 when the app and its database are up, 503 when the database isn't
  app.get("/healthz", (req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({ ok: dbUp });
  });

  // The CSP only applies to the built site; in development the client is served by Vite
  app.use(helmet({ contentSecurityPolicy: isProduction ? contentSecurityPolicy : false }));

  // Where-to-buy redirects (P15-3)
  app.use("/go", createGoRouter({ limit: rateLimits === false ? 10000 : 60 }));

  app.use(
    "/graphql",
    cors({ origin: (origin, callback) => callback(null, Boolean(origin) && isAllowedOrigin(origin)) }),
    express.json({ limit: "100kb" }),
    rejectOperatorKeys,
    ...graphqlRateLimits(rateLimits),
    cookieParser(),
    sessionMiddleware,
    expressMiddleware(server, {
      context: authMiddleware,
    })
  );

  if (isProduction) {
    app.use(express.static(path.join(__dirname, "../client/dist")));

    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
  }

  return { app, server };
};

module.exports = { createApp };
