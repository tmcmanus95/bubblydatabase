const { User, BubblyWater, Rating, Review } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    users: async () => {
      return User.find();
    },

    user: async (parent, { userId }) => {
      return User.findOne({ _id: userId }).populate({
        populate: {
          path: "ratings",
          model: "Rating",
        },
      });
    },

    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate({
          populate: {
            path: "responses",
            model: "Response",
          },
        });
      }
      throw AuthenticationError;
    },
    bubblywaters: async () => {
      return BubblyWater.find();
    },

    flavors: async (parent, { flavor }) => {
      return BubblyWater.find({ flavor: flavor }).populate("ratings");
    },
    brand: async (parent, { brandName }) => {
      return BubblyWater.find({ brandName: brandName }).populate("ratings");
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);

      return { token, user };
    },
    removeUser: async (parent, { userId }) => {
      return User.findOneAndDelete({ _id: userId });
    },

    addRating: async (parent, { userId, bubblyWaterId, rating }, context) => {
      try {
        const newRating = await Rating.create({ rating: rating });

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

        return updatedBubblyWater;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to add rating to water");
      }
    },
    //   editTopic: async (parent, { topicId, promptText }, context) => {
    //     try {
    //       const updatedTopic = await Topic.findByIdAndUpdate(
    //         topicId,
    //         { $set: { promptText } },
    //         { new: true }
    //       );

    //       return updatedTopic;
    //     } catch (error) {
    //       console.error(error);
    //       throw new Error("Failed to edit topic");
    //     }
    //   },
    //   removeTopic: async (parent, { topicId }, context) => {
    //     return User.findOneAndUpdate(
    //       { _id: context.user._id },
    //       { $pull: { savedTopics: { topic: topicId } } },
    //       { new: true }
    //     );
    //   },
    //   addResponse: async (
    //     parent,
    //     { topicId, responseText, imageURL },
    //     context
    //   ) => {
    //     try {
    //       const newResponse = await Response.create({
    //         topicId: topicId,
    //         responseText: responseText,
    //         imageURL: imageURL,
    //       });

    //       const updatedTopic = await Topic.findByIdAndUpdate(
    //         topicId,
    //         {
    //           $addToSet: { responses: newResponse._id },
    //         },
    //         {
    //           new: true,
    //           runValidators: true,
    //         }
    //       ).populate("responses");

    //       return updatedTopic;
    //     } catch (error) {
    //       console.error(error);
    //       throw new Error("Failed to add response to Topic");
    //     }
    //   },
    //   editResponse: async (parent, { responseId, responseText }, context) => {
    //     try {
    //       const updatedResponse = await Response.findByIdAndUpdate(
    //         responseId,
    //         { $set: { responseText } },
    //         { new: true }
    //       );

    //       return updatedResponse;
    //     } catch (error) {
    //       console.error(error);
    //       throw new Error("Failed to edit response");
    //     }
    //   },
    //   removeResponse: async (parent, { topicId, responseId }, context) => {
    //     return Topic.findOneAndUpdate(
    //       { _id: topicId },
    //       { $pull: { responses: responseId } },
    //       { new: true }
    //     );
    //   },
    //   login: async (parent, { email, password }) => {
    //     const user = await User.findOne({ email });

    //     if (!user) {
    //       throw AuthenticationError;
    //     }

    //     const correctPw = await user.isCorrectPassword(password);

    //     if (!correctPw) {
    //       throw AuthenticationError;
    //     }

    //     const token = signToken(user);
    //     return { token, user };
    //   },
    // },
  },
};

module.exports = resolvers;
