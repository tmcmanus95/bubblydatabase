// Sets one account's role (P1-7). Prints what changed; touches nothing else.
//
//   node server/scripts/setRole.js <username or email> admin|user   (staging or local, from server/.env)
//   MONGODB_URI='<production uri>' node server/scripts/setRole.js <username or email> admin --i-am-thomas-on-prod
// (Staging emails are scrubbed to user+<id>@example.test, so the username is easiest there.)
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { assertStaging, parseMongoUri } = require("./lib/assertStaging");

const [who, role] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const onProd = process.argv.includes("--i-am-thomas-on-prod");
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bubblywater";

if (!who || !["admin", "user"].includes(role)) {
  console.error("usage: node server/scripts/setRole.js <username or email> admin|user [--i-am-thomas-on-prod]");
  process.exit(1);
}
if (!onProd) assertStaging(uri);

const main = async () => {
  const parsed = parseMongoUri(uri);
  console.log(`Database: ${parsed ? parsed.dbName : "(unknown)"}${onProd ? "  (production override)" : ""}`);
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000 }).asPromise();
  try {
    const users = connection.db.collection("users");
    const key = who.trim();
    const before = await users.findOne({ $or: [{ username: key }, { email: key }] }, { projection: { username: 1, role: 1 } });
    if (!before) {
      console.error(`No account with username or email ${key}`);
      process.exitCode = 1;
      return;
    }
    await users.updateOne({ _id: before._id }, { $set: { role } });
    console.log(`${before.username}: ${before.role || "(no role)"} -> ${role}`);
  } finally {
    await connection.close();
  }
};

main().catch((error) => {
  console.error(`Failed: ${error.message}`);
  process.exit(1);
});
