import { Link, useParams } from "react-router-dom";
import {
  QUERY_SEARCH_USERS,
  QUERY_SINGLE_BRAND,
  QUERY_SEARCH_FLAVORS,
  QUERY_SEARCH_VAGUE_PRODUCT_NAME,
  QUERY_ALL_DATABASE,
} from "../../utils/queries";
import { useQuery } from "@apollo/client";
import { formatBrands } from "../../utils/formatBrands";
import BubblyWaterListItem from "../components/BubblyWaterListItem";
export default function SearchResults() {
  const { searchTerm } = useParams();
  let brandSearchTerm = searchTerm.toLowerCase().replace(/ /g, "-");
  console.log("search terh: ", searchTerm);
  const {
    data: productData,
    error: productError,
    loading: productLoading,
  } = useQuery(QUERY_SEARCH_VAGUE_PRODUCT_NAME, {
    variables: { productName: searchTerm },
  });
  const {
    data: queryAllData,
    error: queryAllError,
    loading: queryAllLoading,
  } = useQuery(QUERY_ALL_DATABASE, {
    variables: { searchTerm: searchTerm },
  });
  console.log("queryAllData", queryAllData);

  const {
    data: brandData,
    error: brandError,
    loading: brandLoading,
  } = useQuery(QUERY_SINGLE_BRAND, {
    variables: { brandName: brandSearchTerm },
  });
  const {
    data: flavorData,
    error: flavorError,
    loading: flavorLoading,
  } = useQuery(QUERY_SEARCH_FLAVORS, {
    variables: { flavor: searchTerm },
  });
  const {
    data: userData,
    error: userError,
    loading: userLoading,
  } = useQuery(QUERY_SEARCH_USERS, {
    variables: { username: searchTerm },
  });

  console.log("brand search term", brandSearchTerm);
  console.log("Results from product search", productData);
  console.log("Results from brand search", brandData);
  console.log("Results from flavor search", flavorData);
  console.log("Results from user search", userData);
  const searchResults = queryAllData?.searchGeneralBubblyWater;
  console.log("searchResults", searchResults);
  return (
    <>
      <section>
        <div>
          {queryAllLoading ? (
            <h1>Searching products...</h1>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {searchResults.map((result, index) => (
                <div key={index} className="p-4 border rounded">
                  <img
                    src={result.imageURL}
                    alt={result.brandName}
                    width={150}
                    height={150}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                    }}
                    className="w-full h-auto mb-2"
                  />
                  <h1 className="text-lg font-semibold">
                    {result.productName}
                  </h1>
                  <p className="text-sm text-gray-600 line-clamp-3"></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* <div>
        {productLoading ? (
          <h1>Searching products...</h1>
        ) : (
          <>
            <h1 className="text-2xl w-full">Products</h1>
            {productData?.searchVagueProductName ? (
              <>
                {productData.searchVagueProductName.map(
                  (bubblyWater, index) => (
                    <div key={index}>
                      <Link to={`/bubblyWater/${bubblyWater._id}`}>
                        <h2>{bubblyWater.productName}</h2>
                        <h2>{bubblyWater.brandName}</h2>
                        <img
                          width={150}
                          height={150}
                          src={bubblyWater.imageURL}
                          alt={`${bubblyWater.brandName} - ${bubblyWater.productName}`}
                        />
                      </Link>
                    </div>
                  )
                )}
              </>
            ) : (
              <h2>No products named {searchTerm} found</h2>
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
            {brandData?.brand?.length > 0 ? (
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
            <h1 className="text-2xl w-full ">Flavors</h1>
            <Link>Flavor Results</Link>
            {flavorData?.flavors?.length > 0 ? (
              <h2>Flavor data found</h2>
            ) : (
              <h2>No flavors named {searchTerm} found</h2>
            )}
          </>
        )}
      </div> */}
      <div>
        {userLoading ? (
          <h1>Searching users...</h1>
        ) : (
          <>
            <h1 className="text-2xl w-full ">Users</h1>
            <Link>User Results</Link>
            {userData.searchUsers ? (
              <div>
                Username:{" "}
                <Link to={`/user/${userData?.searchUsers?._id}`}>
                  <span>{userData?.searchUsers?.username}</span>
                </Link>
              </div>
            ) : (
              <h2>no users named {searchTerm} found</h2>
            )}
          </>
        )}
      </div>
    </>
  );
}
