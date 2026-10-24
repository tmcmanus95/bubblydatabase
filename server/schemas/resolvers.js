const { GraphQLError } = require("graphql");
const { loginThrottle } = require("../utils/loginThrottle");
const { startSession, endSession, endAllSessions } = require("../utils/sessions");
const { verifyTurnstile } = require("../utils/turnstile");
const { User, BubblyWater, Rating, Review } = require("../models");
const {
  signToken,
  AuthenticationError,
  requireUser,
  requireSelfOrAdmin,
  requireAdmin,
} = require("../utils/auth");
const { sendEmail } = require("../utils/sendEmail");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// A hash of nothing in particular, compared against when no account matches (same cost as real hashes)
const NO_USER_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), User.PASSWORD_COST);
const { triggerAsyncId } = require("async_hooks");
const saltRounds = 10;

// Ratings are 0.5 to 5 in half-star steps
const isValidRating = (rating) =>
  rating >= 0.5 && rating <= 5 && Number.isInteger(rating * 2);

const resolvers = {
  User: {
    // Email is private: only the user themself can read it
    email: (parent, args, context) => {
      if (context.user && String(context.user._id) === String(parent._id)) {
        return parent.email;
      }
      return null;
    },
  },

  Query: {
    users: async (parent, args, context) => {
      await requireAdmin(context);
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
      // Escaped so the search is literal text, never a user-written pattern
      const literal = String(productName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return BubblyWater.find({
        productName: { $regex: literal, $options: "i" },
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
    // Bot friction (P1-8): "website" is a hidden field people never see, so anything in it means a bot.
    // Bots get an ordinary-looking success with nothing created. Turnstile runs when it's configured.
    addUser: async (parent, { username, email, password, website, turnstileToken }, context) => {
      if (website) {
        return { token: null, user: null };
      }
      if (!(await verifyTurnstile(turnstileToken, context.ip))) {
        throw new GraphQLError("Please complete the \"verify you're human\" check and try again.", {
          extensions: { code: "BAD_USER_INPUT", field: "turnstileToken" },
        });
      }
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
        // The token is still returned for clients from before cookie sessions (until P1-6 part 2)
        const token = signToken({
          email: user.email,
          name: user.username,
          _id: user._id,
        });
        await startSession(context, user);

        return { token, user };
      } catch (error) {
        console.error("Error adding user:", error);
        throw new Error("Failed to add user");
      }
    },

    verifyEmail: async (parent, { token, userId }, context) => {
      try {
        const user = await User.findOne({ emailVerificationToken: token });

        if (!user || String(user._id) !== String(userId)) {
          throw AuthenticationError;
        }
        user.isVerified = true;
        user.emailVerificationToken = null;

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
        // Same response whether or not the account exists
        if (!user) {
          return true;
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
        await user.save();
      }
      // Same response whether or not the account exists
      return true;
    },

    resetPassword: async (parent, { email, token, newPassword }) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error("Invalid or expired token");
        }

        const tokenIsValid =
          user.passwordResetToken &&
          user.passwordResetToken === token &&
          user.passwordResetExpires &&
          user.passwordResetExpires.getTime() > Date.now();

        if (!tokenIsValid) {
          throw new Error("Invalid or expired token");
        }

        user.password = newPassword;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();
        // A new password signs out every browser that was using the old one
        await endAllSessions(user._id);

        return { user };
      } catch (error) {
        console.error("Error resetting password:", error);
        throw new Error("Failed to reset password");
      }
    },
    editUserColor: async (parent, { userId, color }, context) => {
      await requireSelfOrAdmin(context, userId);
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
    removeUser: async (parent, { userId }, context) => {
      await requireAdmin(context);
      return User.findOneAndDelete({ _id: userId });
    },

    // The userId argument is ignored: ratings always belong to the logged in user
    addRating: async (parent, { bubblyWaterId, rating }, context) => {
      const userId = requireUser(context);
      if (!isValidRating(rating)) {
        throw new Error("Rating must be between 0.5 and 5 in half steps");
      }
      const alreadyRated = await Rating.exists({
        user: userId,
        bubblyWater: bubblyWaterId,
      });
      if (alreadyRated) {
        throw new Error("You already rated this bubbly water");
      }
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
    editRating: async (parent, { ratingId, rating }, context) => {
      const existingRating = await Rating.findById(ratingId);
      if (!existingRating) {
        throw new Error("Rating not found");
      }
      await requireSelfOrAdmin(context, existingRating.user);
      if (!isValidRating(rating)) {
        throw new Error("Rating must be between 0.5 and 5 in half steps");
      }
      try {
        const updatedRating = await Rating.findOneAndUpdate(
          { _id: ratingId },
          { $set: { rating } },
          { new: true }
        );
        // Recalculate the average for the rating's own bubbly water, not a client-supplied id
        const updatedBubblyWater = await BubblyWater.findOne({
          _id: existingRating.bubblyWater,
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
      const existingRating = await Rating.findById(ratingId);
      if (!existingRating) {
        return null;
      }
      await requireSelfOrAdmin(context, existingRating.user);
      return Rating.findOneAndDelete({ _id: ratingId });
    },
    // The userId argument is ignored: reviews always belong to the logged in user
    addReview: async (parent, { bubblyWaterId, reviewText }, context) => {
      const userId = requireUser(context);
      const reviewer = await User.findById(userId);
      if (!reviewer || !reviewer.isVerified) {
        throw new Error("Please verify your email to write reviews");
      }
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
        reviewer.reviews.push(newReview._id);
        await reviewer.save();
        await updatedBubblyWater.save();
        return updatedBubblyWater;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to add review to bubbly water page");
      }
    },
    editReview: async (parent, { reviewId, reviewText }, context) => {
      const existingReview = await Review.findById(reviewId);
      if (!existingReview) {
        throw new Error("Review not found");
      }
      await requireSelfOrAdmin(context, existingReview.user);
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
      const existingReview = await Review.findById(reviewId);
      if (!existingReview) {
        return null;
      }
      await requireSelfOrAdmin(context, existingReview.user);
      return Review.findOneAndDelete({ _id: reviewId });
    },
    // Repeated failures from an account + IP wait longer and longer, then lock (utils/loginThrottle.js)
    login: async (parent, { email, password }, context) => {
      const ip = context.ip;
      loginThrottle.check(email, ip);

      const user = await User.findOne({ email });
      let correctPw = false;
      if (user) {
        correctPw = await user.isCorrectPassword(password);
      } else {
        // Unknown emails still pay for a bcrypt check, so response times don't reveal which accounts exist
        await bcrypt.compare(password, NO_USER_HASH);
      }

      if (!correctPw) {
        loginThrottle.fail(email, ip);
        throw AuthenticationError;
      }

      loginThrottle.succeed(email, ip);
      await user.upgradePasswordHash(password);
      const token = signToken(user);
      await startSession(context, user);
      return { token, user };
    },
    logout: async (parent, args, context) => {
      await endSession(context);
      return true;
    },
    // The userId argument is ignored: likes always come from the logged in user
    addLikeToReview: async (parent, { reviewId }, context) => {
      const userId = requireUser(context);
      try {
        const review = await Review.findById(reviewId);
        const user = await User.findById(userId);
        if (!review || !user) {
          throw new Error("Review or User not found");
        }
        // Check if the user has already liked the review
        if (user.likedReviews.includes(reviewId)) {
          throw new Error("User has already liked this review");
        }
        review.likes += 1;
        await review.save();
        user.likedReviews.push(reviewId);
        await user.save();

        return {
          reviewId: reviewId,
          newLikeCount: review.likes,
        };
      } catch (error) {
        console.error(error);
        throw new Error("Failed to like review");
      }
    },
    removeLikeFromReview: async (parent, { reviewId }, context) => {
      const userId = requireUser(context);
      try {
        const review = await Review.findById(reviewId);
        const user = await User.findById(userId);
        if (!review || !user) {
          throw new Error("Review or User not found");
        }
        // Check if the user has liked the review
        if (!user.likedReviews.includes(reviewId)) {
          throw new Error("User has not liked this review");
        }
        review.likes = Math.max((review.likes || 1) - 1, 0);
        await review.save();
        user.likedReviews = user.likedReviews.filter(
          (id) => id.toString() !== reviewId
        );
        await user.save();

        return {
          reviewId: reviewId,
          newLikeCount: review.likes,
        };
      } catch (error) {
        console.error(error);
        throw new Error("Failed to remove like from review");
      }
    },
  },
};

module.exports = resolvers;
