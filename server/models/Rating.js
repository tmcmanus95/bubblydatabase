const { Schema, model } = require("mongoose");

const ratingSchema = new Schema(
  {
    rating: {
      type: Number,
    },
    bubblyWater: {
      type: Schema.Types.ObjectId,
      ref: "BubblyWater",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      getters: true,
    },
    id: false,
  }
);

// Same names/options as migrations/202610240003-add-rating-review-product-indexes.js (the migration creates
// them in staging/production; declaring them here keeps test databases and the code in step)
ratingSchema.index({ bubblyWater: 1 }, { name: "bubblyWater_1" });
ratingSchema.index({ user: 1, createdAt: -1 }, { name: "user_1_createdAt_-1" });
ratingSchema.index({ createdAt: -1 }, { name: "createdAt_-1" });
ratingSchema.index(
  { user: 1, bubblyWater: 1 },
  { name: "user_1_bubblyWater_1", unique: true, partialFilterExpression: { user: { $type: "objectId" } } }
);

const Rating = model("Rating", ratingSchema);

module.exports = Rating;
