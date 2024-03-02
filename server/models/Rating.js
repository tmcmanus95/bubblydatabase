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

const Rating = model("Rating", ratingSchema);

module.exports = Rating;
