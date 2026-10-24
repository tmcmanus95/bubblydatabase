import { gql } from "@apollo/client";
export const ADD_USER = gql`
  mutation addUser($username: String!, $email: String!, $password: String!, $website: String, $turnstileToken: String) {
    addUser(username: $username, email: $email, password: $password, website: $website, turnstileToken: $turnstileToken) {
      user {
        _id
        username
        email
      }
    }
  }
`;

export const EDIT_USER_COLOR = gql`
  mutation Mutation($userId: ID!, $color: String) {
    editUserColor(userId: $userId, color: $color) {
      _id
      username
      color
    }
  }
`;

export const ADD_REVIEW = gql`
  mutation Mutation($bubblyWaterId: ID!, $userId: ID!, $reviewText: String!) {
    addReview(
      bubblyWaterId: $bubblyWaterId
      userId: $userId
      reviewText: $reviewText
    ) {
      _id
      productName
      brandName
      reviews {
        _id
        reviewText
        user {
          _id
          username
        }
      }
    }
  }
`;

export const EDIT_REVIEW = gql`
  mutation Mutation($reviewId: ID!, $reviewText: String!) {
    editReview(reviewId: $reviewId, reviewText: $reviewText) {
      _id
      reviewText
      user {
        _id
        username
      }
    }
  }
`;

export const ADD_RATING = gql`
  mutation Mutation($bubblyWaterId: ID!, $rating: Float!, $userId: ID) {
    addRating(bubblyWaterId: $bubblyWaterId, rating: $rating, userId: $userId) {
      _id
      productName
      brandName
      averageRating
      ratings {
        _id
        rating
        bubblyWater {
          _id
        }
        user {
          username
        }
      }
    }
  }
`;

export const EDIT_RATING = gql`
  mutation Mutation($ratingId: ID!, $rating: Float!, $bubblyWaterId: ID) {
    editRating(
      ratingId: $ratingId
      rating: $rating
      bubblyWaterId: $bubblyWaterId
    ) {
      _id
      rating
    }
  }
`;

export const LOGIN_USER = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        _id
        username
      }
    }
  }
`;

export const VERIFY_EMAIL = gql`
  mutation Mutation($token: String!, $userId: ID!) {
    verifyEmail(token: $token, userId: $userId) {
      token
      user {
        _id
        username
        email
        isVerified
      }
    }
  }
`;
export const SEND_PASSWORD_RESET_LINK = gql`
  mutation Mutation($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const RESEND_VERIFICATION_LINK = gql`
  mutation Mutation($email: String!) {
    resendEmailVerification(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation Mutation($token: String!, $email: String!, $newPassword: String!) {
    resetPassword(token: $token, email: $email, newPassword: $newPassword) {
      token
      user {
        _id
        username
      }
    }
  }
`;

export const ADD_LIKE_TO_REVIEW = gql`
  mutation Mutation($userId: ID!, $reviewId: ID!) {
    addLikeToReview(userId: $userId, reviewId: $reviewId) {
      _id
      username
      likedReviews {
        reviewText
      }
    }
  }
`;

export const REMOVE_LIKE_FROM_REVIEW = gql`
  mutation Mutation($userId: ID!, $reviewId: ID!) {
    removeLikeFromReview(userId: $userId, reviewId: $reviewId) {
      username
      likedReviews {
        reviewText
        _id
      }
    }
  }
`;

// Rate (or re-rate: addRating is an upsert, P1-15). Returns just the product's new numbers, which
// Apollo merges into every card showing that product.
export const RATE_PRODUCT = gql`
  mutation RateProduct($bubblyWaterId: ID!, $rating: Float!) {
    addRating(bubblyWaterId: $bubblyWaterId, rating: $rating) {
      _id
      averageRating
      avgRating
      ratingCount
    }
  }
`;

export const REMOVE_RATING = gql`
  mutation RemoveRating($ratingId: ID!) {
    removeRating(ratingId: $ratingId) {
      _id
    }
  }
`;

// Admin offer management (P15-2); each returns the product's full offer list
export const ADD_OFFER = gql`
  mutation AddOffer($bubblyWaterId: ID!, $offer: OfferInput!) {
    addOffer(bubblyWaterId: $bubblyWaterId, offer: $offer) {
      _id
      retailer
      network
      asin
      url
      affiliateUrl
      packSize
      active
      status
      lastChecked
    }
  }
`;
export const EDIT_OFFER = gql`
  mutation EditOffer($bubblyWaterId: ID!, $offerId: ID!, $offer: OfferInput!) {
    editOffer(bubblyWaterId: $bubblyWaterId, offerId: $offerId, offer: $offer) {
      _id
      retailer
      network
      asin
      url
      affiliateUrl
      packSize
      active
      status
      lastChecked
    }
  }
`;
export const SET_OFFER_ACTIVE = gql`
  mutation SetOfferActive($bubblyWaterId: ID!, $offerId: ID!, $active: Boolean!) {
    setOfferActive(bubblyWaterId: $bubblyWaterId, offerId: $offerId, active: $active) {
      _id
      retailer
      network
      asin
      url
      affiliateUrl
      packSize
      active
      status
      lastChecked
    }
  }
`;
