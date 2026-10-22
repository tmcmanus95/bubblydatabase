// Small factories for test data. Passwords go through the real User pre-save hook (bcrypt).
const { User, BubblyWater, Rating } = require("../models");

let counter = 0;

const createUser = (overrides = {}) => {
  counter += 1;
  return User.create({
    username: `tester${counter}`,
    email: `tester${counter}@example.test`,
    password: "password123",
    isVerified: true,
    ...overrides,
  });
};

const createBubbly = (overrides = {}) =>
  BubblyWater.create({
    productName: "Lime",
    brandName: "la-croix",
    flavor: ["lime"],
    isCaffeinated: false,
    hasCBD: false,
    tags: ["lime", "la croix"],
    ...overrides,
  });

// Adds a rating linked on both sides, the way addRating does
const addRatingFor = async (user, bubbly, rating) => {
  const doc = await Rating.create({ rating, user: user._id, bubblyWater: bubbly._id });
  await BubblyWater.updateOne({ _id: bubbly._id }, { $push: { ratings: doc._id } });
  await User.updateOne({ _id: user._id }, { $push: { ratings: doc._id } });
  return doc;
};

module.exports = { createUser, createBubbly, addRatingFor };
