const { Schema, model } = require("mongoose");

// Where to buy (P15): see schemas/offerSchema.js for the rules
const offerSchema = new Schema(
  {
    retailer: { type: String, required: true },
    network: { type: String, required: true },
    asin: String,
    url: String,
    affiliateUrl: String,
    packSize: String,
    active: { type: Boolean, default: true },
    lastChecked: Date,
    status: { type: String, default: "unknown" },
  },
  { timestamps: true }
);

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
    // Stored aggregates (P1-14, migration 202610240004), kept current on every rating/review write (P1-15).
    // averageRating stays equal to avgRating until the client reads avgRating.
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    // Set when an admin archives the product (P2-2): hidden from public lists and search, ratings kept
    archivedAt: { type: Date, default: null },
    // Added by migration 202610240005 (P15-1)
    offers: { type: [offerSchema], default: [] },
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
