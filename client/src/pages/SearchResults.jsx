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

  const searchResults = queryAllData?.searchGeneralBubblyWater;
  return (
    <>
      <div className="mt-20 mb-5 px-2">
        {queryAllLoading ? (
          <h1 className="text-xl md:text-4xl">Searching products...</h1>
        ) : (
          <>
            <h1 className="text-4xl mb-5 ml-2 md:ml-5">Products</h1>

            {searchResults && searchResults.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {searchResults.map((result, index) => (
                    <Link to={`/bubblyWater/${result._id}`} key={index}>
                      <div className="p-4 border rounded bg-gray-100 flex hover:bg-blue-100">
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
                        <div className="ml-4 flex flex-col justify-center">
                          <h1 className="text-lg font-semibold">
                            {result.productName}
                          </h1>
                          <h1 className="text-lg font-semibold">
                            {formatBrands(result.brandName)}
                          </h1>
                          <p className="text-sm text-gray-600 line-clamp-3"></p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <h1 className="ml-2 md:ml-5 text-lg md:text-xl mb-5">
                No search results with term "{searchTerm}" found.
              </h1>
            )}
          </>
        )}
      </div>
      <div className="px-2 mb-20">
        {userLoading ? (
          <h1 className="text-xl md:text-4xl">Searching users...</h1>
        ) : (
          <>
            <h1 className="text-4xl mb-5 ml-2 md:ml-5">Users</h1>
            {userData.searchUsers ? (
              <div className="bg-white text-xl md:text-2xl mr-2 md:mr-10 hover:bg-blue-200">
                <Link to={`/user/${userData?.searchUsers?._id}`}>
                  <span>{userData?.searchUsers?.username}</span>
                </Link>
              </div>
            ) : (
              <h2 className="ml-2 md:ml-5 text-lg md:text-xl mb-5">
                No users named "{searchTerm}" found.
              </h2>
            )}
          </>
        )}
      </div>
    </>
  );
}
