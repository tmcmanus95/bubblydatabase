// The only way maintenance scripts should connect to MongoDB.
// Loads server/.env, refuses anything but staging or a local database, then connects.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { assertStaging } = require("./assertStaging");

// Same fallback as config/connection.js
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bubblywater";
assertStaging(uri);

module.exports = require("../../config/connection");
