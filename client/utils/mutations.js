import { gql } from "@apollo/client";
export const ADD_USER = gql`
  mutation addUser($username: String!, $email: String!, $password: String!) {
    addUser(username: $username, email: $email, password: $password) {
      token
      user {
        _id
        username
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
      imageURL
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
  mutation Mutation($ratingId: ID!, $rating: Float!) {
    editRating(ratingId: $ratingId, rating: $rating) {
      _id
      rating
    }
  }
`;

export const LOGIN_USER = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        _id
        username
      }
    }
  }
`;
