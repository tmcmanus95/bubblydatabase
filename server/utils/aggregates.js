const { BubblyWater } = require("../models");

// Keeps each product's stored aggregates (avgRating, ratingCount, reviewCount; P1-14) current on every
// rating/review write (P1-15). Each change is a single-document update pipeline, so concurrent writes can't
// lose each other's updates. averageRating mirrors avgRating until the client reads avgRating. The nightly
// recompute (P1-16) corrects any floating-point drift.
const n = (field) => ({ $ifNull: [`$${field}`, 0] });

// avg' from the current avg/count after removing `oldValue` (or nothing) and adding `newValue` (or nothing)
const ratingChange = (productId, { add = null, remove = null }) => {
  const delta = (add === null ? 0 : 1) - (remove === null ? 0 : 1);
  const newCount = { $add: [n("ratingCount"), delta] };
  const newSum = { $add: [{ $multiply: [n("avgRating"), n("ratingCount")] }, add || 0, -(remove || 0)] };
  const newAvg = { $cond: [{ $gt: [newCount, 0] }, { $divide: [newSum, newCount] }, 0] };
  return BubblyWater.updateOne({ _id: productId }, [
    { $set: { avgRating: newAvg, ratingCount: { $max: [newCount, 0] } } },
    { $set: { averageRating: "$avgRating" } },
  ]);
};

const ratingAdded = (productId, value) => ratingChange(productId, { add: value });
const ratingEdited = (productId, oldValue, newValue) => ratingChange(productId, { add: newValue, remove: oldValue });
const ratingRemoved = (productId, value) => ratingChange(productId, { remove: value });
const reviewCountChange = (productId, by) =>
  BubblyWater.updateOne({ _id: productId }, [{ $set: { reviewCount: { $max: [{ $add: [n("reviewCount"), by] }, 0] } } }]);

module.exports = {
  ratingAdded,
  ratingEdited,
  ratingRemoved,
  reviewAdded: (productId) => reviewCountChange(productId, 1),
  reviewRemoved: (productId) => reviewCountChange(productId, -1),
};
