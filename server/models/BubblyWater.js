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

// Same names as migrations/202610240003-add-rating-review-product-indexes.js
bubblyWaterSchema.index({ flavor: 1, averageRating: -1 }, { name: "flavor_1_averageRating_-1" });
bubblyWaterSchema.index({ brandName: 1 }, { name: "brandName_1" });
bubblyWaterSchema.index({ averageRating: -1 }, { name: "averageRating_-1" });

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
