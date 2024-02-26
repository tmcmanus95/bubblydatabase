const { Schema, model } = require("mongoose");

const reviewSchema = new Schema(
  {
    reviewText: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    rating: [
      {
        type: Schema.Types.ObjectId,
        ref: "Rating",
      },
    ],
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
