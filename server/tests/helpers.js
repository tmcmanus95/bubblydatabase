// Test setup: an in-memory MongoDB plus the real Express/GraphQL app, with email in log mode.
// Uses the local `mongod` if one is installed; otherwise mongodb-memory-server downloads a MongoDB
// binary once (cached). Never connects to Atlas.

// Set before any app module loads: auth reads MY_SECRET at require time, and dotenv (loaded by
// sendEmail) never overrides variables that are already set, even empty ones.
process.env.EMAIL_MODE = "log";
process.env.MY_SECRET = "test-only-secret";
process.env.ADMIN_USER_IDS = "";
process.env.WEBSITE_URL = "http://localhost:5001";

const assert = require("node:assert");
const { spawnSync } = require("child_process");
const mongoose = require("mongoose");
const supertest = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const { createApp } = require("../app");
const { signToken } = require("../utils/auth");
const { outbox } = require("../utils/sendEmail");

const localMongod = () => {
  const result = spawnSync("sh", ["-c", "command -v mongod"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
};

// Starts the in-memory database and the app. Call stop() in an `after` hook. Rate limits are off unless
// a test passes its own (see utils/rateLimits.js).
const startTestServer = async ({ rateLimits = false } = {}) => {
  const systemBinary = localMongod();
  const mongo = await MongoMemoryServer.create(systemBinary ? { binary: { systemBinary } } : {});
  await mongoose.connect(mongo.getUri("bubbly_test"));
  assert.strictEqual(mongoose.connection.host, "127.0.0.1", "tests must only use the in-memory database");

  const { app, server } = await createApp({ rateLimits });
  const request = supertest(app);

  // Sends a GraphQL operation; pass a user document to send their JWT
  const gql = async (query, variables = {}, user) => {
    const req = request.post("/graphql").set("Content-Type", "application/json");
    if (user) {
      req.set("Authorization", `Bearer ${signToken({ email: user.email, name: user.username, _id: user._id })}`);
    }
    const res = await req.send({ query, variables });
    return res.body;
  };

  const stop = async () => {
    await server.stop();
    await mongoose.disconnect();
    await mongo.stop();
  };

  // Empties every collection between tests
  const reset = async () => {
    outbox.length = 0;
    for (const collection of Object.values(mongoose.connection.collections)) {
      await collection.deleteMany({});
    }
  };

  return { request, gql, stop, reset, outbox };
};

module.exports = { startTestServer };
