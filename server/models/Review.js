const { Schema, model } = require("mongoose");

const reviewSchema = new Schema(
  {
    reviewText: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 500,
    },
    votes: {
      type: Number,
      default: 0,
    },
    bubblyWater: {
      type: Schema.Types.ObjectId,
      ref: "BubblyWater",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rating: {
      type: Schema.Types.ObjectId,
      ref: "Rating",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    toJSON: {
      getters: true,
    },
    id: false,
  }
);

// Same names as migrations/202610240003-add-rating-review-product-indexes.js
reviewSchema.index({ bubblyWater: 1, createdAt: -1 }, { name: "bubblyWater_1_createdAt_-1" });
reviewSchema.index({ user: 1, createdAt: -1 }, { name: "user_1_createdAt_-1" });
reviewSchema.index({ createdAt: -1 }, { name: "createdAt_-1" });

const Review = model("Review", reviewSchema);

module.exports = Review;
