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
    flavor: [String]
    isCaffeinated: Boolean
    hasCBD: Boolean
    averageRating: Float
    ratings: [Rating]
    reviews: [Review]
  }

  type Rating {
    _id: ID
    rating: Float
    bubblyWater: BubblyWater
    createdAt: String
    user: User
  }

  type Review {
    _id: ID
    reviewText: String
    createdAt: String
    user: User
    rating: [Rating]
  }

  type Auth {
    token: ID!
    user: User
  }

  type Query {
    users: [User]
    user(userId: ID!): User
    meId: User
    me: User
    bubblyWaters: [BubblyWater]
    bubblyWater(bubblyWaterId: ID): BubblyWater 
    rating(ratingId: ID): Rating
    flavors(flavor: [String]): [BubblyWater]
    brand(brandName: String): [BubblyWater]
    searchFlavors(flavor: [String]): [BubblyWater]
    searchExactProductName(productName: String): [BubblyWater]
    searchVagueProductName(productName: String): [BubblyWater]
    searchUsers(username: String): User
    searchTags(searchTerm: String): [BubblyWater]
    searchGeneralBubblyWater(searchTerm: String): [BubblyWater]
  }

  type Mutation {
    addUser(username: String!, email: String!, password: String!): Auth
    removeUser: User
    login(email: String!, password: String!): Auth
    addRating(bubblyWaterId: ID!, userId: ID, rating: Float!): BubblyWater
    editRating(ratingId: ID!, rating: Float!): Rating
    removeRating(ratingId: ID!): Rating
    addReview(bubblyWaterId: ID!, userId: ID!, reviewText: String!): BubblyWater
    editReview(reviewId: ID!, reviewText: String!): Review
    removeReview(reviewId: ID!): Review
  }
`;

module.exports = typeDefs;
