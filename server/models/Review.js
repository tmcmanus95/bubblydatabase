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
  },
  {
    toJSON: {
      getters: true,
    },
    id: false,
  }
);

const Review = model("Review", reviewSchema);

module.exports = Review;
