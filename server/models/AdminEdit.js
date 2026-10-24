const { Schema, model } = require("mongoose");

// One admin change (P2-1): who did what to which record, with the record before and after. Written by
// utils/audit.js from every admin mutation; read by admins. Indexes come from migration 202610240007.
const adminEditSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g. "offer.add", "product.archive"
    targetType: { type: String, required: true }, // "product", "brand", "flavor", "submission"
    targetId: { type: Schema.Types.ObjectId, required: true },
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    at: { type: Date, default: Date.now },
  },
  { autoIndex: false, autoCreate: false, versionKey: false }
);

module.exports = model("AdminEdit", adminEditSchema);
