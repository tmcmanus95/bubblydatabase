const { BubblyWater, Review } = require("../models");

const updateTopReviews = async () => {
  console.log("Starting top reviews update...");

  try {
    // Use aggregation to efficiently find top reviews for all bubbly waters at once
    const topReviewsData = await Review.aggregate([
      // Group by bubblyWater and find the review with most likes
      {
        $sort: { likes: -1, createdAt: -1 },
      },
      {
        $group: {
          _id: "$bubblyWater",
          topReview: { $first: "$$ROOT" },
        },
      },
    ]);

    let updatedCount = 0;

    // Update each bubbly water with its top review
    for (const item of topReviewsData) {
      const result = await BubblyWater.findByIdAndUpdate(
        item._id,
        {
          topReview: item.topReview._id,
          topReviewUpdatedAt: new Date(),
        },
        { new: true } // Return the updated document
      );

      if (result) {
        updatedCount++;
      }
    }

    // Also clear topReview for bubbly waters that no longer have reviews
    await BubblyWater.updateMany(
      {
        _id: { $nin: topReviewsData.map((item) => item._id) },
        topReview: { $exists: true },
      },
      {
        $unset: { topReview: 1 },
        topReviewUpdatedAt: new Date(),
      }
    );

    console.log(
      `Top reviews update completed. Updated ${updatedCount} bubbly waters.`
    );
    return { success: true, updated: updatedCount };
  } catch (error) {
    console.error("Error updating top reviews:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { updateTopReviews };
