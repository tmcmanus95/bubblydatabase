import { Link, useParams } from "react-router-dom";
import { QUERY_PRODUCT_NAME } from "../../utils/queries";
import { useQuery } from "@apollo/client";
export default function SearchResults() {
  const searchTerm = useParams();
  const { data: productData, error: productError } = useQuery(
    QUERY_PRODUCT_NAME,
    {
      variables: { productName: searchTerm },
    }
  );
  console.log("Results from product search", productData);
  return (
    <>
      <Link>Product Results</Link>
      <Link>Brand Results</Link>
      <Link>Flavor Results</Link>
      <Link>User Results</Link>
    </>
  );
}
