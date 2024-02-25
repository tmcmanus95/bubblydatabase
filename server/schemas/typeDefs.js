const typeDefs = `
  type User {
    _id: ID
    username: String
    email: String
    password: String
    ratings: [Rating]
    reviews: [Review]

  }

  type BubblyWater {
    _id: ID
    productName: String
    brandName: String
    imageURL: String
    flavor: String
    isCaffeinated: Boolean
    hasCBD: Boolean
    ratings: [Rating]
    reviews: [Review]
  }

  type Rating {
    _id: ID
    rating: Number
    createdAt: String
    user: [User]
  }

  type Review {
    _id: ID
    reviewText: String
    createdAt: String
    user: [User]!
    rating: [Rating]
  }

  type Auth {
    token: ID!
    user: User
  }

  type Query {
    users: [User]
    user(userId: ID!): User
    me: User
    bubblywaters: [BubblyWater]
    flavors(flavor: String): [BubblyWater]
    brand(brandName: String): [BubblyWater]
  }

  type Mutation {
    addUser(username: String!, email: String!, password: String!): Auth
    removeUser: User
    login(email: String!, password: String!): Auth
    addRating(userId: ID!, rating: Number!): Rating
    editRating(userID: ID!, rating: Number!): Rating
    removeRating(ratingId: ID!): Rating
    addReview(userId: ID!, reviewText: String!): Review
    editReview(userID: ID!, reviewText: String!): Review
    removeReview(reviewId: ID!): Review
  }
`;

module.exports = typeDefs;
