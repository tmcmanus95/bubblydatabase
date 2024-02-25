const { Schema, model } = require("mongoose");

const ratingSchema = new Schema(
  {
    rating: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
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

const Rating = model("Review", ratingSchema);

module.exports = Rating;
