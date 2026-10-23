const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { expressMiddleware } = require("@apollo/server/express4");
const { ApolloServer } = require("@apollo/server");
const path = require("path");
const { authMiddleware } = require("./utils/auth");
const typeDefs = require("./schemas/typeDefs");
const { graphqlRateLimits } = require("./utils/rateLimits");
const resolvers = require("./schemas/resolvers");

// What the built site is allowed to load. Images stay open to any https host until the typographic
// cards replace third-party product images (P1-0c/d); then imgSrc tightens to 'self' and data:.
const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    // MUI/emotion injects <style> tags; Google Fonts serves the Lilita One stylesheet
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    imgSrc: ["'self'", "data:", "https:"],
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

// How many proxies sit in front of the app (TRUST_PROXY). Render puts one load balancer in front, so
// production trusts one hop and req.ip is the visitor's address rather than the proxy's; rate limits key
// on req.ip. Trusting more hops than exist would let visitors fake their IP via X-Forwarded-For.
const trustProxy = (isProduction) => {
  const value = process.env.TRUST_PROXY;
  if (value === undefined || value === "") return isProduction ? 1 : false;
  if (/^\d+$/.test(value)) return Number(value);
  return value === "true" ? true : value === "false" ? false : value;
};

// Builds the Express app with GraphQL mounted. Doesn't connect to MongoDB or listen on a port, so
// tests can use it with their own database. `rateLimits`: see utils/rateLimits.js (false = off).
const createApp = async ({ rateLimits } = {}) => {
  const isProduction = process.env.NODE_ENV === "production";
  const app = express();
  app.set("trust proxy", trustProxy(isProduction));
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();

  // The CSP only applies to the built site; in development the client is served by Vite
  app.use(helmet({ contentSecurityPolicy: isProduction ? contentSecurityPolicy : false }));

  app.use(
    "/graphql",
    cors({ origin: (origin, callback) => callback(null, Boolean(origin) && isAllowedOrigin(origin)) }),
    express.json({ limit: "100kb" }),
    ...graphqlRateLimits(rateLimits),
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
