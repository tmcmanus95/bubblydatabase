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
          populate: {
            path: "bubblyWater",
            model: "BubblyWater",
          },
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
            populate: {
              path: "bubblyWater",
              model: "BubblyWater",
            },
          },
        ]);
      }
      throw AuthenticationError;
    },
    bubblyWaters: async () => {
      return BubblyWater.find()
        .populate("ratings")
        .sort({ averageRating: -1 })
        .limit(200);
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
          populate: { path: "user", model: "User" },
        });
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
    editRating: async (parent, { ratingId, rating }, context) => {
      try {
        const updatedRating = await Rating.findOneAndUpdate(
          { _id: ratingId },
          { $set: { rating } },
          { new: true }
        );

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
        const newReview = await Review.create({
          reviewText: reviewText,
          bubblyWater: bubblyWaterId,
          user: userId,
        });

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
