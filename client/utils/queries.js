import { gql } from "@apollo/client";

export const QUERY_SINGLE_FLAVOR = gql`
  query Query($flavor: String) {
    flavors(flavor: $flavor) {
      _id
      productName
      brandName
      imageURL
      flavor
      isCaffeinated
      hasCBD
    }
  }
`;

export const QUERY_SINGLE_BUBBLYWATER = gql`
  query Query($bubblyWaterId: ID) {
    bubblyWater(bubblyWaterId: $bubblyWaterId) {
      productName
      brandName
      imageURL
      flavor
      isCaffeinated
      hasCBD
      ratings {
        _id
        rating
        user {
          username
        }
      }
      reviews {
        _id
        reviewText
        user {
          username
        }
      }
    }
  }
`;
