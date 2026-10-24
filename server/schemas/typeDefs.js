const typeDefs = `
  type User {
    _id: ID
    username: String
    email: String
    color: String
    ratings: [Rating]
    reviews: [Review]
    isVerified: Boolean
    likedReviews: [Review]
  }
  
  type AuthPayload {
    token: String
    user: User
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
    avgRating: Float
    ratingCount: Int
    reviewCount: Int
    ratings: [Rating]
    reviews: [Review]
  }

  type Rating {
    _id: ID
    rating: Float
    bubblyWaterId: ID
    bubblyWater: BubblyWater
    createdAt: String
    user: User
  }

  type Review {
    _id: ID
    reviewText: String
    createdAt: String
    bubblyWater: BubblyWater
    user: User
    rating: Rating
    likes: Float
  }

  type Auth {
    token: ID
    user: User
  }

  enum SearchSort {
    TOP_RATED
    MOST_RATED
    NAME
    NEWEST
  }

  type SearchResult {
    total: Int!
    page: Int!
    pageSize: Int!
    results: [BubblyWater!]!
  }

  type Query {
    search(q: String, flavor: [String], brand: String, caffeine: Boolean, cbd: Boolean, sort: SearchSort, page: Int, pageSize: Int): SearchResult!
    users: [User]
    user(userId: ID!): User
    usersRatings(userId: ID!, numRange: String!): User
    usersReviews(userId: ID!, numRange: String!): User
    simpleRatings(userId: ID!): User
    meId: User
    me: User
    bubblyWaters: [BubblyWater]
    allBubblies: [BubblyWater]
    bubblyWater(bubblyWaterId: ID): BubblyWater
    caffeinatedBubblys: [BubblyWater]
    cbdBubblys: [BubblyWater]
    rating(ratingId: ID): Rating
    ratings: [Rating]
    reviews: [Review]
    flavors(flavor: [String]): [BubblyWater]
    brand(brandName: String): [BubblyWater]
    searchFlavors(flavor: [String]): [BubblyWater]
    searchExactProductName(productName: String): [BubblyWater]
    searchVagueProductName(productName: String): [BubblyWater]
    searchUsers(username: String): User
    recentRatings: [Rating]
    recentReviews: [Review]
    searchTags(searchTerm: String): [BubblyWater]
    searchGeneralBubblyWater(searchTerm: String): [BubblyWater]
    queryUserRatingsOfGivenNumber(userId: ID!, rating: Float): User
    findUsersRating(userId: ID!, bubblyWaterId: ID!): Rating
    myRatings(bubblyWaterIds: [ID!]!): [Rating!]!
  }

  type Mutation {
    addUser(username: String!, email: String!, password: String!, website: String, turnstileToken: String): AuthPayload
    removeUser(userId: ID!): User
    editUserColor(userId: ID!, color: String): User
    login(email: String!, password: String!): Auth
    logout: Boolean
    addRating(bubblyWaterId: ID!, userId: ID, rating: Float!): BubblyWater
    editRating(ratingId: ID!, rating: Float!, bubblyWaterId: ID): Rating
    removeRating(ratingId: ID!): Rating
    addReview(bubblyWaterId: ID!, userId: ID!, reviewText: String!): BubblyWater
    editReview(reviewId: ID!, reviewText: String!): Review
    removeReview(reviewId: ID!): Review
    verifyEmail(token: String!, userId: ID!): AuthPayload
    forgotPassword(email: String!): Boolean
    resendEmailVerification(email: String!): Boolean
    resetPassword(token: String!, email: String!, newPassword: String!): AuthPayload
    addLikeToReview(userId: ID!, reviewId: ID!): User
    removeLikeFromReview(userId: ID!, reviewId: ID!): User
  }
`;

module.exports = typeDefs;
