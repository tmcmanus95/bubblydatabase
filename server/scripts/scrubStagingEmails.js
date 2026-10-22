// Replaces every user's email with user+<id>@example.test and clears reset/verification tokens, so a
// staging copy of production can never email real people. Passwords are untouched: log in to
// staging as user+<your _id>@example.test with your normal password.
//
//   node scripts/scrubStagingEmails.js <mongodb-uri-with-db>
//
// Only runs against bubblydatabase3_staging or a local database.
const mongoose = require("mongoose");
const { assertStaging, parseMongoUri } = require("./lib/assertStaging");

const [uri] = process.argv.slice(2);
if (!uri) {
  console.error("usage: node scripts/scrubStagingEmails.js <mongodb-uri-with-db>");
  process.exit(1);
}
assertStaging(uri);

const main = async () => {
  const { dbName } = parseMongoUri(uri);
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000 }).asPromise();
  try {
    const users = connection.db.collection("users");
    const result = await users.updateMany({ email: { $not: /@example\.test$/ } }, [
      {
        $set: {
          email: { $concat: ["user+", { $toString: "$_id" }, "@example.test"] },
          passwordResetToken: null,
          passwordResetExpires: null,
          emailVerificationToken: null,
        },
      },
    ]);
    const remaining = await users.countDocuments({ email: { $not: /@example\.test$/ } });
    console.log(`Scrubbed ${result.modifiedCount} user emails in "${dbName}"`);
    if (remaining > 0) {
      console.error(`FAILED: ${remaining} users still have a real-looking email`);
      process.exitCode = 1;
    }
  } finally {
    await connection.close();
  }
};

main().catch((err) => {
  console.error(`scrubStagingEmails failed: ${err.message.replace(/\/\/[^@/\s]*@/g, "//<redacted>@")}`);
  process.exit(1);
});
