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
    rating: Float
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
    bubblyWaters: [BubblyWater]
    bubblyWater(bubblyWaterId: ID): BubblyWater 
    rating(ratingId: ID): Rating
    flavors(flavor: String): [BubblyWater]
    brand(brandName: String): [BubblyWater]
  }

  type Mutation {
    addUser(username: String!, email: String!, password: String!): Auth
    removeUser: User
    login(email: String!, password: String!): Auth
    addRating(bubblyWaterId: ID!, rating: Float!): BubblyWater
    editRating(ratingId: ID!, rating: Float!): Rating
    removeRating(ratingId: ID!): Rating
    addReview(bubblyWaterId: ID!, reviewText: String!): BubblyWater
    editReview(reviewId: ID!, reviewText: String!): Review
    removeReview(reviewId: ID!): Review
  }
`;

module.exports = typeDefs;
