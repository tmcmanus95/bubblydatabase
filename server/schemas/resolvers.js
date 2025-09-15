const { User, BubblyWater, Rating, Review } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");
const { sendEmail } = require("../utils/sendEmail");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { triggerAsyncId } = require("async_hooks");
const saltRounds = 10;

const resolvers = {
  Query: {
    users: async () => {
      const users = await User.find();
      console.log(users.length + " users");
      return users;
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
    usersRatings: async (parent, { userId, numRange }) => {
      const [start, end] = numRange.split("-").map(Number);
      const limit = end - start + 1;
      const skip = start - 1;

      const user = await User.findOne({ _id: userId }).populate({
        path: "ratings",
        options: { sort: { createdAt: -1 }, skip, limit },
        populate: {
          path: "bubblyWater",
          model: "BubblyWater",
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    },
    usersReviews: async (parent, { userId, numRange }) => {
      const [start, end] = numRange.split("-").map(Number);
      const limit = end - start + 1;
      const skip = start - 1;

      const user = await User.findOne({ _id: userId }).populate({
        path: "reviews",
        options: { sort: { createdAt: -1 }, skip, limit },
        populate: {
          path: "bubblyWater",
          model: "BubblyWater",
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user;
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
      return BubblyWater.aggregate([
        {
          $match: {
            $expr: { $gt: [{ $size: "$ratings" }, 3] },
          },
        },
        {
          $lookup: {
            from: "ratings",
            localField: "ratings",
            foreignField: "_id",
            as: "ratings",
          },
        },
        {
          $addFields: {
            averageRating: { $avg: "$ratings.rating" },
          },
        },
        {
          $sort: { averageRating: -1 },
        },
        {
          $limit: 50,
        },
      ]);
    },
    allBubblies: async () => {
      const allBubblies = await BubblyWater.find();
      return allBubblies;
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
    ratings: async () => {
      const ratings = await Rating.find()
        .populate("bubblyWater")
        .populate("user");
      console.log(ratings.length + " ratings");
      return ratings;
    },
    reviews: async () => {
      const reviews = await Review.find()
        .populate("bubblyWater")
        .populate("user")
        .populate("rating");
      console.log(reviews.length + " reviews");
      return reviews;
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
    recentRatings: async () => {
      return Rating.find()
        .populate("user")
        .populate("bubblyWater")
        .sort({ createdAt: -1 })
        .limit(10);
    },
    recentReviews: async () => {
      return Review.find()
        .populate("user")
        .populate({
          path: "bubblyWater",
          populate: {
            path: "ratings",
            model: "Rating",
          },
        })
        .sort({ createdAt: -1 })
        .limit(10);
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
          return null;
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
      colors = [
        "user-teal",
        "user-cyan",
        "user-sky",
        "user-blue",
        "user-lime",
        "user-green",
        "user-emerald",
        "user-yellow",
        "user-red",
        "user-purple",
        "user-indigo",
        "user-violet",
        "user-fuchsia",
        "user-orange",
        "user-amber",
        "user-pink",
        "user-rose",
      ];
      const userColor = colors[Math.floor(Math.random() * colors.length)];
      try {
        const emailVerificationToken = crypto.randomBytes(20).toString("hex");

        const user = await User.create({
          username,
          email,
          password,
          emailVerificationToken: emailVerificationToken,
          isVerified: false,
          color: userColor,
        });

        const verificationUrl = `${process.env.WEBSITE_URL}/verifyEmail/${emailVerificationToken}`;
        await sendEmail({
          to: email,
          subject: "Bubbles Account Email Verification",
          text: `Please verify your email by clicking the following link: ${verificationUrl}`,
        });
        const token = signToken({
          email: user.email,
          name: user.username,
          _id: user._id,
        });

        return { token, user };
      } catch (error) {
        console.error("Error adding user:", error);
        throw new Error("Failed to add user");
      }
    },

    verifyEmail: async (parent, { token, userId }, context) => {
      try {
        const user = await User.findOne({ emailVerificationToken: token });

        if (!user) {
          throw AuthenticationError;
        }
        if (user._id == userId) {
          user.isVerified = true;
          user.emailVerificationToken = null;
        }

        await user.save();

        return { user };
      } catch (error) {
        console.error("Error verifying email:", error);
        throw AuthenticationError;
      }
    },

    forgotPassword: async (parent, { email }) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error("No user found with this email");
        }

        const resetToken = crypto.randomBytes(20).toString("hex");

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.WEBSITE_URL}/resetPassword/${resetToken}`;
        if (user) {
          await sendEmail({
            to: email,
            subject: "Password Reset",
            text: `Please reset your password by clicking the following link: ${resetUrl}`,
          });
          return true;
        } else {
          return;
        }
      } catch (error) {
        console.error("Error in forgot password:", error);
        throw new Error("Failed to process forgot password");
      }
    },

    resendEmailVerification: async (parent, { email }) => {
      const user = await User.findOne({ email });
      const emailVerificationToken = crypto.randomBytes(20).toString("hex");
      if (user) {
        user.emailVerificationToken = emailVerificationToken;
        const verificationUrl = `${process.env.WEBSITE_URL}/verifyEmail/${emailVerificationToken}`;
        await sendEmail({
          to: email,
          subject: "Bubbles. Account Email Verification",
          text: `Please verify your email by clicking the following link: ${verificationUrl}`,
        });
      }
      await user.save();
    },

    resetPassword: async (parent, { email, token, newPassword }) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error("Invalid or expired token");
        }

        if (user.passwordResetToken === token) {
          user.password = newPassword;
          user.passwordResetToken = null;
          user.passwordResetExpires = null;
        } else {
          console.log("user.passwordResetToken and token do not match!");
          return;
        }
        await user.save();

        // const authToken = signToken(user);
        // return { token: authToken, user };
        return user;
      } catch (error) {
        console.error("Error resetting password:", error);
        throw new Error("Failed to reset password");
      }
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

        const existingReview = await Review.findOne({
          user: userId,
          bubblyWater: bubblyWaterId,
        });

        // If there's an existing review from this user for this bubbly water, link the new rating to it
        if (existingReview) {
          await Review.findByIdAndUpdate(existingReview._id, {
            rating: newRating._id,
          });
          console.log(
            `Linked new rating ${newRating._id} to existing review ${existingReview._id}`
          );
        }

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
        console.error("=== ADD RATING ERROR ===");
        console.error("Error details:", error);
        console.error("Stack trace:", error.stack);
        throw new Error("Failed to add rating to water");
      }
    },
    editRating: async (
      parent,
      { ratingId, rating, bubblyWaterId },
      context
    ) => {
      try {
        const updatedRating = await Rating.findOneAndUpdate(
          { _id: ratingId },
          { $set: { rating } },
          { new: true }
        );
        const updatedBubblyWater = await BubblyWater.findOne({
          _id: bubblyWaterId,
        }).populate("ratings");
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
