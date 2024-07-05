const { User, BubblyWater, Rating, Review } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    users: async () => {
      return User.find();
    },

    user: async (parent, { userId }) => {
      return User.findOne({ _id: userId }).populate([
        {
          path: "ratings",
          options: { sort: { createdAt: -1 } },
          populate: {
            path: "bubblyWater",
            model: "BubblyWater",
          },
        },
        {
          path: "reviews",
          options: { sort: { createdAt: -1 } },
          populate: [
            {
              path: "bubblyWater",
              model: "BubblyWater",
            },
            { path: "rating", model: "Rating" },
          ],
        },
      ]);
    },
    simpleRatings: async (parent, { userId }) => {
      return User.findOne({ _id: userId });
    },
    meId: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw AuthenticationError;
    },
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate([
          {
            path: "ratings",
            options: { sort: { createdAt: -1 } },
            populate: {
              path: "bubblyWater",
              model: "BubblyWater",
            },
          },
          {
            path: "reviews",
            options: { sort: { createdAt: -1 } },
            populate: [
              {
                path: "bubblyWater",
                model: "BubblyWater",
              },
              { path: "rating", model: "Rating" },
            ],
          },
        ]);
      }
      throw AuthenticationError;
    },
    bubblyWaters: async () => {
      return BubblyWater.find()
        .populate("ratings")
        .sort({ averageRating: -1 })
        .limit(50);
    },
    bubblyWater: async (parent, { bubblyWaterId }) => {
      return BubblyWater.findOne({ _id: bubblyWaterId })
        .populate({
          path: "ratings",
          populate: {
            path: "user",
            model: "User",
          },
        })
        .populate({
          path: "reviews",
          populate: [
            { path: "user", model: "User" },
            { path: "rating", model: "Rating" },
          ],
        });
    },
    caffeinatedBubblys: async () => {
      return BubblyWater.find({ isCaffeinated: true });
    },
    cbdBubblys: async () => {
      return BubblyWater.find({ hasCBD: true });
    },
    rating: async (parent, { ratingId }) => {
      return Rating.findOne({ _id: ratingId }).populate("bubblyWater");
    },

    flavors: async (parent, { flavor }) => {
      return BubblyWater.find({ flavor: { $in: flavor } }).populate("ratings");
    },
    brand: async (parent, { brandName }) => {
      return BubblyWater.find({ brandName: brandName }).populate("ratings");
    },
    searchFlavors: async (parent, { flavor }) => {
      return BubblyWater.find({ flavor: { $in: flavor } })
        .populate("ratings")
        .sort({ averageRating: -1 })
        .limit(5);
    },
    searchExactProductName: async (parent, { productName }) => {
      return BubblyWater.find({ productName: productName }).limit("5");
    },
    searchVagueProductName: async (parent, { productName }) => {
      return BubblyWater.find({
        productName: { $regex: productName, $options: "i" },
      });
    },
    searchGeneralBubblyWater: async (_, { searchTerm }) => {
      try {
        const results = await BubblyWater.find({
          $text: { $search: searchTerm },
        }).limit(10);

        return results;
      } catch (error) {
        throw new Error("Failed to search bubbly water.");
      }
    },
    searchUsers: async (parent, { username }) => {
      return User.findOne({ username: username });
    },
    queryUserRatingsOfGivenNumber: async (parent, { userId, rating }) => {
      try {
        const user = await User.findOne({ _id: userId }).populate({
          path: "ratings",
          match: { rating: rating },
          populate: {
            path: "bubblyWater",
            model: "BubblyWater",
          },
        });
        return user;
      } catch (error) {
        throw new Error("Error returning users ratings of a specific number");
      }
    },
    findUsersRating: async (_, { userId, bubblyWaterId }, context) => {
      // Check if the user is authenticated

      try {
        const rating = await Rating.findOne({
          user: userId,
          bubblyWater: bubblyWaterId,
        })
          .populate("user")
          .populate("bubblyWater");

        if (!rating) {
          throw new Error("Rating not found");
        }

        return rating;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch the rating");
      }
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);

      return { token, user };
    },
    editUserColor: async (parent, { userId, color }, context) => {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          { $set: { color } },
          { new: true }
        );

        return updatedUser;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to edit color");
      }
    },
    removeUser: async (parent, { userId }) => {
      return User.findOneAndDelete({ _id: userId });
    },

    addRating: async (parent, { userId, bubblyWaterId, rating }, context) => {
      try {
        const newRating = await Rating.create({
          rating: rating,
          bubblyWater: bubblyWaterId,
          user: userId,
        });
        const updatedBubblyWater = await BubblyWater.findOneAndUpdate(
          { _id: bubblyWaterId },
          {
            $addToSet: { ratings: newRating._id },
          },
          {
            new: true,
            runValidators: false,
          }
        ).populate("ratings");

        //Save rating to User page
        const user = await User.findById(userId);
        user.ratings.push(newRating._id);
        await user.save();

        // Update the average rating for the Bubbly Water
        const allRatings = await Rating.find({
          _id: { $in: updatedBubblyWater.ratings },
        });

        const totalRatings = allRatings.reduce(
          (acc, curr) => acc + curr.rating,
          0
        );
        const averageRating = totalRatings / allRatings.length;

        updatedBubblyWater.averageRating = averageRating;
        await updatedBubblyWater.save();

        return updatedBubblyWater;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to add rating to water");
      }
    },
    editRating: async (
      parent,
      { ratingId, rating, bubblyWaterId },
      context
    ) => {
      console.log("Received parameters:", { ratingId, rating, bubblyWaterId });

      try {
        const updatedRating = await Rating.findOneAndUpdate(
          { _id: ratingId },
          { $set: { rating } },
          { new: true }
        );
        const updatedBubblyWater = await BubblyWater.findOne({
          _id: bubblyWaterId,
        }).populate("ratings");
        console.log("bubbly water id", bubblyWaterId);

        console.log("updated bubb", updatedBubblyWater);
        // Update the average rating for the Bubbly Water
        const allRatings = await Rating.find({
          _id: { $in: updatedBubblyWater.ratings },
        });

        const totalRatings = allRatings.reduce(
          (acc, curr) => acc + curr.rating,
          0
        );
        const averageRating = totalRatings / allRatings.length;

        updatedBubblyWater.averageRating = averageRating;
        await updatedBubblyWater.save();

        return updatedRating;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to edit rating");
      }
    },
    removeRating: async (parent, { ratingId }, context) => {
      return Rating.findOneAndDelete({ _id: ratingId });
    },
    addReview: async (
      parent,
      { userId, bubblyWaterId, reviewText },
      context
    ) => {
      try {
        const existingRating = await Rating.findOne({
          user: userId,
          bubblyWater: bubblyWaterId,
        });

        let rating = null;
        if (existingRating) {
          rating = existingRating._id;
        }

        // Create the new review with the attached rating (if exists)
        const newReview = await Review.create({
          reviewText,
          bubblyWater: bubblyWaterId,
          user: userId,
          rating,
        });
        console.log("new review", newReview);
        const updatedBubblyWater = await BubblyWater.findByIdAndUpdate(
          { _id: bubblyWaterId },
          {
            $addToSet: { reviews: newReview._id },
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate("reviews");

        //Save review to User page
        const user = await User.findById(userId);
        user.reviews.push(newReview._id);
        await user.save();
        console.log("ubw", updatedBubblyWater);
        await updatedBubblyWater.save();
        return updatedBubblyWater;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to add review to bubbly water page");
      }
    },
    editReview: async (parent, { reviewId, reviewText }, context) => {
      try {
        const updatedReview = await Review.findByIdAndUpdate(
          reviewId,
          { $set: { reviewText } },
          { new: true }
        );

        return updatedReview;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to edit review");
      }
    },
    removeReview: async (parent, { reviewId }, context) => {
      return Review.findOneAndDelete({ _id: reviewId });
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw AuthenticationError;
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);
      return { token, user };
    },
  },
};

module.exports = resolvers;
