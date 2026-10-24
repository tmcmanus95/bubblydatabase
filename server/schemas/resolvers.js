const { GraphQLError } = require("graphql");
const { loginThrottle } = require("../utils/loginThrottle");
const { startSession, endSession, endAllSessions } = require("../utils/sessions");
const { verifyTurnstile } = require("../utils/turnstile");
const aggregates = require("../utils/aggregates");
const { ratingLimiter } = require("../utils/ratingRules");
const { searchProducts } = require("../utils/search");
const { isAdmin } = require("../utils/auth");
const { recordAdminEdit } = require("../utils/audit");
const { AdminEdit } = require("../models");

// Product fields that cards and lists need: everything but the id arrays of ratings and reviews
const PRODUCT_CARD_FIELDS = "-ratings -reviews -offers";
// Best average first; more ratings break ties
const BEST_FIRST = { avgRating: -1, ratingCount: -1, _id: 1 };
// A profile shows the newest 25 ratings and 10 reviews; "see all" pages are paginated (usersRatings/Reviews)
const PROFILE_RATINGS = 25;
// What an audit entry records about a product (its catalog fields, not ratings or offers)
const productSnapshot = (p) => ({
  productName: p.productName,
  brandName: p.brandName,
  flavor: [...(p.flavor || [])],
  isCaffeinated: p.isCaffeinated,
  hasCBD: p.hasCBD,
  tags: [...(p.tags || [])],
  archivedAt: p.archivedAt || null,
});
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Two products with the same name from the same brand are almost certainly the same product
const assertNotDuplicate = async ({ productName, brandName }, exceptId) => {
  const clash = await BubblyWater.findOne({
    brandName,
    productName: { $regex: `^${escapeRegex(productName)}$`, $options: "i" },
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });
  if (clash) throw new Error(`${productName} by ${brandName} already exists`);
};
const setArchived = async (context, bubblyWaterId, archive) => {
  await requireAdmin(context);
  const before = await BubblyWater.findById(bubblyWaterId);
  if (!before) throw new Error("Bubbly water not found");
  const updated = await BubblyWater.findByIdAndUpdate(bubblyWaterId, { $set: { archivedAt: archive ? new Date() : null } }, { new: true });
  await recordAdminEdit(context, {
    action: archive ? "product.archive" : "product.restore",
    targetType: "product",
    targetId: updated._id,
    before: { archivedAt: before.archivedAt || null },
    after: { archivedAt: updated.archivedAt || null },
  });
  return updated;
};

// Archived products (P2-2) are hidden from every public list and search; null also matches "never archived"
const LIVE = { archivedAt: null };
const PROFILE_REVIEWS = 10;
const PROFILE_POPULATE = [
        {
          path: "ratings",
          options: { sort: { createdAt: -1 }, perDocumentLimit: PROFILE_RATINGS },
          populate: { path: "bubblyWater", model: "BubblyWater", select: PRODUCT_CARD_FIELDS },
        },
        {
          path: "reviews",
          options: { sort: { createdAt: -1 }, perDocumentLimit: PROFILE_REVIEWS },
          populate: [
            { path: "bubblyWater", model: "BubblyWater", select: PRODUCT_CARD_FIELDS },
            { path: "rating", model: "Rating" },
          ],
        },
      ];
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
  BubblyWater: {
    archivedAt: (product) => (product.archivedAt ? new Date(product.archivedAt).toISOString() : null),
    // Only active offers are public (P15)
    offers: (product) => (product.offers || []).filter((o) => o.active),
  },

  Offer: {
    sponsored: (offer) =>
      offer.network === "amazon" ? Boolean((process.env.AMAZON_ASSOCIATE_TAG || "").trim()) : Boolean(offer.affiliateUrl),
  },

  AdminEdit: {
    admin: (edit) => User.findById(edit.admin).exec(),
    before: (edit) => (edit.before == null ? null : JSON.stringify(edit.before)),
    after: (edit) => (edit.after == null ? null : JSON.stringify(edit.after)),
    at: (edit) => new Date(edit.at).toISOString(),
  },

  AdminOffer: {
    lastChecked: (offer) => (offer.lastChecked ? new Date(offer.lastChecked).toISOString() : null),
  },

  Rating: {
    // The product's id without loading the product
    bubblyWaterId: (rating) => (rating.bubblyWater ? String(rating.bubblyWater._id || rating.bubblyWater) : null),
  },

  User: {
    // Only tells you about yourself (the UI uses it to show admin tools)
    isAdmin: async (user, args, context) =>
      context.user && String(context.user._id) === String(user._id) ? isAdmin(context) : null,
    // Totals and the 0.5–5 breakdown, counted in the database (a profile only loads its newest few)
    // .exec(): hand GraphQL a real promise, not a Mongoose query (which it could try to run twice)
    ratingCount: (user) => Rating.countDocuments({ user: user._id }).exec(),
    reviewCount: (user) => Review.countDocuments({ user: user._id }).exec(),
    ratingBreakdown: async (user) => {
      const groups = await Rating.aggregate([{ $match: { user: user._id } }, { $group: { _id: "$rating", count: { $sum: 1 } } }]);
      const counts = new Map(groups.map((g) => [g._id, g.count]));
      return [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5].map((rating) => ({ rating, count: counts.get(rating) || 0 }));
    },
    // Email is private: only the user themself can read it
    email: (parent, args, context) => {
      if (context.user && String(context.user._id) === String(parent._id)) {
        return parent.email;
      }
      return null;
    },
  },

  Query: {
    // One search with filters, sorting and pages (P1-19); the older search* queries remain for now
    search: async (parent, args, context) =>
      searchProducts({ ...args, includeArchived: Boolean(args.includeArchived) && (await isAdmin(context)) }),
    users: async (parent, args, context) => {
      await requireAdmin(context);
      const users = await User.find();
      console.log(users.length + " users");
      return users;
    },

    // A profile: the newest 25 ratings and 10 reviews (totals and the breakdown are User fields)
    user: async (parent, { userId }) => {
      return User.findOne({ _id: userId }).populate(PROFILE_POPULATE);
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
        return User.findOne({ _id: context.user._id }).populate(PROFILE_POPULATE);
      }
      throw AuthenticationError;
    },
    // Home top 50: products with more than 3 ratings, best average first, more ratings breaking ties.
    // Uses the stored aggregates (P1-14/15), so no ratings are loaded.
    bubblyWaters: async () => {
      return BubblyWater.find({ ...LIVE, ratingCount: { $gt: 3 } }, PRODUCT_CARD_FIELDS).sort(BEST_FIRST).limit(50);
    },
    // An archived product's page is only visible to admins (so they can restore it)
    bubblyWater: async (parent, { bubblyWaterId }, context) => {
      const product = await BubblyWater.findOne({ _id: bubblyWaterId })
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
      if (product && product.archivedAt && !(await isAdmin(context))) return null;
      return product;
    },
    caffeinatedBubblys: async () => {
      return BubblyWater.find({ ...LIVE, isCaffeinated: true }, PRODUCT_CARD_FIELDS).sort(BEST_FIRST);
    },
    cbdBubblys: async () => {
      return BubblyWater.find({ ...LIVE, hasCBD: true }, PRODUCT_CARD_FIELDS).sort(BEST_FIRST);
    },
    rating: async (parent, { ratingId }) => {
      return Rating.findOne({ _id: ratingId }).populate("bubblyWater");
    },
    flavors: async (parent, { flavor }) => {
      return BubblyWater.find({ ...LIVE, flavor: { $in: flavor } }, PRODUCT_CARD_FIELDS).sort(BEST_FIRST);
    },
    brand: async (parent, { brandName }) => {
      return BubblyWater.find({ ...LIVE, brandName: brandName }, PRODUCT_CARD_FIELDS).sort(BEST_FIRST);
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
    // Each review comes with the reviewer's own rating (linked on the review), not every rating of the product
    recentReviews: async () => {
      return Review.find()
        .populate("user")
        .populate("rating")
        .populate({ path: "bubblyWater", select: PRODUCT_CARD_FIELDS })
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
    // The admin audit log, newest first: everything, or one record's history (admins only; P2-1)
    adminEdits: async (_, { targetId, limit }, context) => {
      await requireAdmin(context);
      return AdminEdit.find(targetId ? { targetId } : {}).sort({ at: -1 }).limit(limit || 50).exec();
    },
    // Every offer on a product, links included (admins only; P15-2)
    adminOffers: async (_, { bubblyWaterId }, context) => {
      await requireAdmin(context);
      const product = await BubblyWater.findById(bubblyWaterId, { offers: 1 });
      if (!product) throw new Error("Bubbly water not found");
      return product.offers;
    },
    // The logged-in user's ratings for a page of products, in one request (P1-22); [] when logged out
    myRatings: async (_, { bubblyWaterIds }, context) => {
      if (!context.user) return [];
      return Rating.find({ user: context.user._id, bubblyWater: { $in: bubblyWaterIds } });
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
      ratingLimiter.check(userId);
      if (!(await BubblyWater.exists({ _id: bubblyWaterId }))) {
        throw new Error("Bubbly water not found");
      }
      try {
        // One rating per user per product (unique index, P1-13): rating again updates it
        const previous = await Rating.findOneAndUpdate(
          { user: userId, bubblyWater: bubblyWaterId },
          { $set: { rating }, $setOnInsert: { user: userId, bubblyWater: bubblyWaterId, createdAt: new Date() } },
          { upsert: true, new: false }
        );
        if (previous) {
          if (previous.rating !== rating) await aggregates.ratingEdited(bubblyWaterId, previous.rating, rating);
        } else {
          const newRating = await Rating.findOne({ user: userId, bubblyWater: bubblyWaterId });
          await BubblyWater.updateOne({ _id: bubblyWaterId }, { $addToSet: { ratings: newRating._id } });
          await User.updateOne({ _id: userId }, { $addToSet: { ratings: newRating._id } });
          // Link it to this user's review of the product, if they wrote one first
          await Review.updateMany({ user: userId, bubblyWater: bubblyWaterId, rating: null }, { $set: { rating: newRating._id } });
          await aggregates.ratingAdded(bubblyWaterId, rating);
        }
        return BubblyWater.findById(bubblyWaterId).populate("ratings");
      } catch (error) {
        console.error("Error adding rating:", error);
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
      ratingLimiter.check(requireUser(context));
      try {
        const updatedRating = await Rating.findOneAndUpdate(
          { _id: ratingId },
          { $set: { rating } },
          { new: true }
        );
        // Update the rating's own bubbly water, not a client-supplied id
        if (existingRating.rating !== rating) {
          await aggregates.ratingEdited(existingRating.bubblyWater, existingRating.rating, rating);
        }
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
      const removed = await Rating.findOneAndDelete({ _id: ratingId });
      if (removed) {
        await BubblyWater.updateOne({ _id: removed.bubblyWater }, { $pull: { ratings: removed._id } });
        await User.updateOne({ _id: removed.user }, { $pull: { ratings: removed._id } });
        await Review.updateMany({ rating: removed._id }, { $set: { rating: null } });
        await aggregates.ratingRemoved(removed.bubblyWater, removed.rating);
      }
      return removed;
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
        await BubblyWater.updateOne({ _id: bubblyWaterId }, { $addToSet: { reviews: newReview._id } });

        //Save review to User page
        reviewer.reviews.push(newReview._id);
        await reviewer.save();
        await aggregates.reviewAdded(bubblyWaterId);
        return BubblyWater.findById(bubblyWaterId).populate("reviews");
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
      const removed = await Review.findOneAndDelete({ _id: reviewId });
      if (removed) {
        await BubblyWater.updateOne({ _id: removed.bubblyWater }, { $pull: { reviews: removed._id } });
        await User.updateMany({ $or: [{ reviews: removed._id }, { likedReviews: removed._id }] }, { $pull: { reviews: removed._id, likedReviews: removed._id } });
        await aggregates.reviewRemoved(removed.bubblyWater);
      }
      return removed;
    },
    // Offer management (admins only; P15-2). Each returns the product's full offer list.
    addOffer: async (_, { bubblyWaterId, offer }, context) => {
      await requireAdmin(context);
      const product = await BubblyWater.findByIdAndUpdate(
        bubblyWaterId,
        { $push: { offers: { ...offer, status: "unknown" } } },
        { new: true, projection: { offers: 1 } }
      );
      if (!product) throw new Error("Bubbly water not found");
      const added = product.offers[product.offers.length - 1];
      await recordAdminEdit(context, { action: "offer.add", targetType: "product", targetId: bubblyWaterId, after: added });
      return product.offers;
    },
    editOffer: async (_, { bubblyWaterId, offerId, offer }, context) => {
      await requireAdmin(context);
      const set = {};
      for (const [k, v] of Object.entries(offer)) set[`offers.$.${k}`] = v ?? null;
      set["offers.$.status"] = "unknown"; // links changed: the weekly check looks again
      const product = await BubblyWater.findOneAndUpdate(
        { _id: bubblyWaterId, "offers._id": offerId },
        { $set: set },
        { new: false, projection: { offers: 1 } }
      );
      if (!product) throw new Error("Offer not found");
      const updated = await BubblyWater.findById(bubblyWaterId, { offers: 1 });
      await recordAdminEdit(context, {
        action: "offer.edit",
        targetType: "product",
        targetId: bubblyWaterId,
        before: product.offers.id(offerId),
        after: updated.offers.id(offerId),
      });
      return updated.offers;
    },
    setOfferActive: async (_, { bubblyWaterId, offerId, active }, context) => {
      await requireAdmin(context);
      const product = await BubblyWater.findOneAndUpdate(
        { _id: bubblyWaterId, "offers._id": offerId },
        { $set: { "offers.$.active": active } },
        { new: true, projection: { offers: 1 } }
      );
      if (!product) throw new Error("Offer not found");
      await recordAdminEdit(context, {
        action: active ? "offer.activate" : "offer.deactivate",
        targetType: "product",
        targetId: bubblyWaterId,
        before: { offerId, active: !active },
        after: { offerId, active },
      });
      return product.offers;
    },
    // Product admin (P2-2): admins only, validated, audit-logged. Products are archived, never deleted.
    createProduct: async (_, { product }, context) => {
      await requireAdmin(context);
      await assertNotDuplicate(product);
      const created = await BubblyWater.create({ ...product, ratings: [], reviews: [], offers: [] });
      await recordAdminEdit(context, { action: "product.create", targetType: "product", targetId: created._id, after: productSnapshot(created) });
      return created;
    },
    updateProduct: async (_, { bubblyWaterId, product }, context) => {
      await requireAdmin(context);
      const before = await BubblyWater.findById(bubblyWaterId);
      if (!before) throw new Error("Bubbly water not found");
      await assertNotDuplicate(product, bubblyWaterId);
      const updated = await BubblyWater.findByIdAndUpdate(bubblyWaterId, { $set: product }, { new: true });
      await recordAdminEdit(context, {
        action: "product.update",
        targetType: "product",
        targetId: updated._id,
        before: productSnapshot(before),
        after: productSnapshot(updated),
      });
      return updated;
    },
    // Add/remove flavors and tags on many products at once (admin products page); one audit entry per product
    bulkEditProducts: async (_, { bubblyWaterIds, addFlavors = [], removeFlavors = [], addTags = [], removeTags = [] }, context) => {
      await requireAdmin(context);
      const products = await BubblyWater.find({ _id: { $in: bubblyWaterIds } });
      const results = [];
      for (const before of products) {
        const flavor = [...new Set([...before.flavor.filter((f) => !removeFlavors.includes(f)), ...addFlavors])];
        const tags = [...new Set([...(before.tags || []).filter((x) => !removeTags.includes(x)), ...addTags])];
        if (!flavor.length) throw new Error(`${before.productName} would be left with no flavors`);
        const updated = await BubblyWater.findByIdAndUpdate(before._id, { $set: { flavor, tags } }, { new: true });
        await recordAdminEdit(context, { action: "product.bulkEdit", targetType: "product", targetId: before._id, before: productSnapshot(before), after: productSnapshot(updated) });
        results.push(updated);
      }
      return results;
    },
    archiveProduct: async (_, { bubblyWaterId }, context) => setArchived(context, bubblyWaterId, true),
    restoreProduct: async (_, { bubblyWaterId }, context) => setArchived(context, bubblyWaterId, false),
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
