const { Schema, model } = require("mongoose");

// One where-to-buy redirect (P15-3). Deliberately anonymous: no user, IP or browser details. Indexes come
// from migrations/202610240006-create-clicks.js. Never used for badges or awards (SPEC; P15-7 test).
const clickSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    offerId: { type: Schema.Types.ObjectId, required: true },
    network: String,
    ts: { type: Date, default: Date.now },
    referrerPath: String,
  },
  { autoIndex: false, autoCreate: false, versionKey: false }
);

module.exports = model("Click", clickSchema);
