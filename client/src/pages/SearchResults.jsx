import { Link, useParams } from "react-router-dom";
import {
  QUERY_PRODUCT_NAME,
  QUERY_SINGLE_BRAND,
  QUERY_SINGLE_FLAVOR,
} from "../../utils/queries";
import { useQuery } from "@apollo/client";
export default function SearchResults() {
  const { searchTerm } = useParams();
  console.log("search terh: ", searchTerm);
  const {
    data: productData,
    error: productError,
    loading: productLoading,
  } = useQuery(QUERY_PRODUCT_NAME, {
    variables: { productName: searchTerm },
  });
  const {
    data: brandData,
    error: brandError,
    loading: brandLoading,
  } = useQuery(QUERY_SINGLE_BRAND, {
    variables: { brandName: searchTerm },
  });
  const {
    data: flavorData,
    error: flavorError,
    loading: flavorLoading,
  } = useQuery(QUERY_SINGLE_FLAVOR, {
    variables: { flavor: searchTerm },
  });

  console.log("Results from product search", productData);
  console.log("Results from brand search", brandData);
  console.log("Results from flavor search", flavorData);

  return (
    <>
      <div>
        {productLoading ? (
          <h1>Searching products...</h1>
        ) : (
          <>
            <h1 className="text-2xl w-full ">Products</h1>
            <Link>Product Results</Link>
            {productData.length > 0 ? (
              <h2>product data found</h2>
            ) : (
              <h2>no products named {searchTerm} found</h2>
            )}
          </>
        )}
      </div>
      <div>
        {brandLoading ? (
          <h1>Searching brands...</h1>
        ) : (
          <>
            <h1 className="text-2xl w-full ">Brands</h1>
            <Link>brand Results</Link>
            {productData.length > 0 ? (
              <h2>brand data found</h2>
            ) : (
              <h2>no brands named {searchTerm} found</h2>
            )}
          </>
        )}
      </div>
      <div>
        {flavorLoading ? (
          <h1>Searching flavors...</h1>
        ) : (
          <>
            <h1 className="text-2xl w-full ">Products</h1>
            <Link>Product Results</Link>
            {productData.length > 0 ? (
              <h2>product data found</h2>
            ) : (
              <h2>no products named {searchTerm} found</h2>
            )}
          </>
        )}
      </div>
      <div>
        {productLoading ? (
          <h1>Searching products...</h1>
        ) : (
          <>
            <h1 className="text-2xl w-full ">Products</h1>
            <Link>Product Results</Link>
            {productData.length > 0 ? (
              <h2>product data found</h2>
            ) : (
              <h2>no products named {searchTerm} found</h2>
            )}
          </>
        )}
      </div>
    </>
  );
}
