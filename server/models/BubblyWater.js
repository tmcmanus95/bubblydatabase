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
    averageRating: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
      },
    ],
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

bubblyWaterSchema.index({
  productName: "text",
  brandName: "text",
  tags: "text",
});

bubblyWaterSchema.virtual("ratingsCount").get(function () {
  return this.ratings.length;
});

const BubblyWater = model("BubblyWater", bubblyWaterSchema);

module.exports = BubblyWater;
