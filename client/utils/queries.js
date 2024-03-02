import { gql } from "@apollo/client";

export const QUERY_SINGLE_FLAVOR = gql`
  query Query($flavor: [String]) {
    flavors(flavor: $flavor) {
      _id
      productName
      brandName
      imageURL
      flavor
      isCaffeinated
      hasCBD
      averageRating
      ratings {
        rating
        user {
          username
        }
      }
    }
  }
`;

export const QUERY_SINGLE_BUBBLYWATER = gql`
  query Query($bubblyWaterId: ID) {
    bubblyWater(bubblyWaterId: $bubblyWaterId) {
      _id
      productName
      brandName
      imageURL
      flavor
      isCaffeinated
      hasCBD
      averageRating
      ratings {
        _id
        rating
        user {
          _id
          username
        }
      }
    }
  }
`;

export const QUERY_SINGLE_USER = gql`
  query Query($userId: ID!) {
    user(userId: $userId) {
      _id
      username
      ratings {
        _id
        rating
        bubblyWater {
          _id
          productName
          brandName
        }
      }
    }
  }
`;

export const QUERY_ME = gql`
  query Query {
    me {
      _id
      username
      ratings {
        _id
        rating
        bubblyWater {
          _id
          productName
          brandName
          flavor
        }
      }
    }
  }
`;

export const QUERY_MEID = gql`
  query Query {
    meId {
      _id
    }
  }
`;
