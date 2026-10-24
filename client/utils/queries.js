import { gql } from "@apollo/client";

export const QUERY_ALL_BUBBLYS = gql`
  query Query {
    bubblyWaters {
      _id
      productName
      brandName
      flavor
      isCaffeinated
      hasCBD
      averageRating
      ratingCount
    }
  }
`;

export const QUERY_All_CAFFEINATED_BUBBLYS = gql`
  query Query {
    caffeinatedBubblys {
      _id
      productName
      brandName
      flavor
      isCaffeinated
      hasCBD
      averageRating
      ratingCount
    }
  }
`;

export const QUERY_ALL_CBD_BUBBLYS = gql`
  query Query {
    cbdBubblys {
      _id
      productName
      brandName
      flavor
      isCaffeinated
      hasCBD
      averageRating
      ratingCount
    }
  }
`;

export const QUERY_SINGLE_FLAVOR = gql`
  query Query($flavor: [String]) {
    flavors(flavor: $flavor) {
      _id
      productName
      brandName
      flavor
      isCaffeinated
      hasCBD
      averageRating
      ratingCount
    }
  }
`;

export const QUERY_SINGLE_BUBBLYWATER = gql`
  query Query($bubblyWaterId: ID) {
    bubblyWater(bubblyWaterId: $bubblyWaterId) {
      _id
      productName
      brandName
      flavor
      isCaffeinated
      hasCBD
      averageRating
      offers {
        _id
        retailer
        network
        packSize
        sponsored
      }
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
        likes
        user {
          _id
          username
        }
        rating {
          rating
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
      ratingCount
      reviewCount
      ratingBreakdown {
        rating
        count
      }
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
      reviews {
        _id
        reviewText
        bubblyWater {
          _id
          productName
          brandName
          flavor
        }
        rating {
          rating
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
      flavor
      isCaffeinated
      hasCBD
      averageRating
      ratingCount
    }
  }
`;

export const QUERY_ME = gql`
  query Query {
    me {
      _id
      username
      color
      ratingCount
      reviewCount
      ratingBreakdown {
        rating
        count
      }
      isVerified
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
      reviews {
        _id
        reviewText
        bubblyWater {
          _id
          productName
          brandName
          flavor
        }
        rating {
          rating
        }
      }
      isVerified
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
      isVerified
      isAdmin
      likedReviews {
        _id
        reviewText
      }
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



export const QUERY_SPECIFIC_USER_RATINGS = gql`
  query ($userId: ID!, $rating: Float) {
    queryUserRatingsOfGivenNumber(userId: $userId, rating: $rating) {
      _id
      username
      ratings {
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


export const QUERY_USERS_RATINGS_BY_RANGE = gql`
  query UsersRatings($userId: ID!, $numRange: String!) {
    usersRatings(userId: $userId, numRange: $numRange) {
      _id
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

export const QUERY_USERS_REVIEWS_BY_RANGE = gql`
  query Query($userId: ID!, $numRange: String!) {
    usersReviews(userId: $userId, numRange: $numRange) {
      _id
      username
      reviews {
        _id
        reviewText
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
export const QUERY_RECENT_RATINGS_AND_REVIEWS = gql`
  query Query {
    recentReviews {
      _id
      reviewText
      createdAt
      rating {
        rating
      }
      bubblyWater {
        _id
        productName
        brandName
        flavor
      }
      user {
        _id
        username
        color
      }
    }
  }
`;

// One search for products (P1-19): filters, sorting and pages; results carry stored counts, not ratings
export const QUERY_SEARCH = gql`
  query Search($q: String, $flavor: [String], $caffeine: Boolean, $cbd: Boolean, $sort: SearchSort, $page: Int, $pageSize: Int) {
    search(q: $q, flavor: $flavor, caffeine: $caffeine, cbd: $cbd, sort: $sort, page: $page, pageSize: $pageSize) {
      total
      page
      pageSize
      results {
        _id
        productName
        brandName
        flavor
        isCaffeinated
        hasCBD
        averageRating
        ratingCount
      }
    }
  }
`;

// The logged-in user's ratings for a page of products, in one request (P1-22)
export const QUERY_MY_RATINGS = gql`
  query MyRatings($ids: [ID!]!) {
    myRatings(bubblyWaterIds: $ids) {
      _id
      rating
      bubblyWaterId
    }
  }
`;

// Admin offer management (P15-2)
export const QUERY_ADMIN_OFFERS = gql`
  query AdminOffers($bubblyWaterId: ID!) {
    adminOffers(bubblyWaterId: $bubblyWaterId) {
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
