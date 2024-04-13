import { gql } from "@apollo/client";

export const QUERY_ALL_BUBBLYS = gql`
  query Query {
    bubblyWaters {
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
      }
    }
  }
`;

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
          color
        }
      }
      reviews {
        _id
        reviewText
        user {
          _id
          username
          color
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
      color
      ratings {
        _id
        rating
        bubblyWater {
          _id
          productName
          brandName
          imageURL
          flavor
        }
      }
      reviews {
        _id
        reviewText
        bubblyWater {
          _id
          productName
          brandName
          imageURL
          flavor
        }
      }
    }
  }
`;

export const QUERY_SINGLE_BRAND = gql`
  query Query($brandName: String) {
    brand(brandName: $brandName) {
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

export const QUERY_ME = gql`
  query Query {
    me {
      _id
      username
      color
      ratings {
        _id
        rating
        bubblyWater {
          _id
          productName
          brandName
          imageURL
          flavor
        }
      }
      reviews {
        _id
        reviewText
        bubblyWater {
          _id
          productName
          brandName
          imageURL
          flavor
        }
      }
    }
  }
`;

export const QUERY_SIMPLE_RATINGS = gql`
  query SimpleRatings($userId: ID!) {
    simpleRatings(userId: $userId) {
      _id
      username
      ratings {
        rating
      }
    }
  }
`;

export const QUERY_MEID = gql`
  query Query {
    meId {
      _id
      username
    }
  }
`;

export const QUERY_SEARCH_VAGUE_PRODUCT_NAME = gql`
  query Query($productName: String) {
    searchVagueProductName(productName: $productName) {
      _id
      productName
      brandName
      imageURL
      flavor
      isCaffeinated
      hasCBD
      averageRating
    }
  }
`;

export const QUERY_SEARCH_USERS = gql`
  query Query($username: String) {
    searchUsers(username: $username) {
      _id
      username
    }
  }
`;

export const QUERY_SEARCH_FLAVORS = gql`
  query Query($flavor: [String]) {
    searchFlavors(flavor: $flavor) {
      _id
      productName
      brandName
      imageURL
    }
  }
`;

export const QUERY_ALL_DATABASE = gql`
  query Query($searchTerm: String) {
    searchGeneralBubblyWater(searchTerm: $searchTerm) {
      _id
      productName
      brandName
      imageURL
      flavor
    }
  }
`;

export const QUERY_SPECIFIC_USER_RATINGS = gql`
  query ($userId: ID!, $rating: Float) {
    queryUserRatingsOfGivenNumber(userId: $userId, rating: $rating) {
      _id
      username
      ratings {
        rating
        bubblyWater {
          productName
          brandName
          imageURL
          flavor
        }
      }
    }
  }
`;
