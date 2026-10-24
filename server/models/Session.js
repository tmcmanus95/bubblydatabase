const { Schema, model } = require("mongoose");

// A signed-in browser (P1-6). The refresh token itself lives only in that browser's httpOnly cookie; here
// we keep its SHA-256 hash, so a database leak can't be replayed. Each refresh replaces the token
// (rotation): the old row is marked revoked and points at its successor. Indexes come from the migration
// migrations/202610230002-create-sessions.js, not from Mongoose.
const sessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: Schema.Types.ObjectId, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { autoIndex: false, autoCreate: false }
);

module.exports = model("Session", sessionSchema);
