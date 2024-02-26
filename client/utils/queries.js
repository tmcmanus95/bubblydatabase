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
