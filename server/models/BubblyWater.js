const { Schema, model } = require("mongoose");

const bubblyWaterSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    brandName: {
      type: String,
      required: true,
    },
    imageURL: {
      type: String,
    },
    flavor: [
      {
        type: String,
      },
    ],
    isCaffeinated: {
      type: Boolean,
    },
    hasCBD: {
      type: Boolean,
    },
    ratings: [
      {
        type: Schema.Types.ObjectId,
        ref: "Rating",
      },
    ],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  {
    toJSON: {
      virtuals: true,
    },
    id: false,
  }
);

const BubblyWater = model("BubblyWater", bubblyWaterSchema);

module.exports = BubblyWater;
