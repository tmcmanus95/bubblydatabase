import { useQuery } from "@apollo/client";
import { QUERY_ALL_BUBBLYS, QUERY_SINGLE_FLAVOR } from "../../utils/queries";
import BubblyWaterListItem from "./BubblyWaterListItem";
import { formatBrands } from "../../utils/formatBrands";
import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";
export default function BubblyWaterList({ searchTerm }) {
  const { error, data } = searchTerm
    ? useQuery(QUERY_SINGLE_FLAVOR, { variables: { flavor: searchTerm } })
    : useQuery(QUERY_ALL_BUBBLYS);
  let sortedBubblyWaters = [];

  //We only need to sort the single flavor query, as the QUERY_ALL_BUBBLYS resolver already returns the bubbly waters sorted by average rating
  if (searchTerm) {
    if (data && data.flavors) {
      sortedBubblyWaters = data.flavors
        .slice()
        .sort((a, b) => b.averageRating - a.averageRating);
    }
  }

  console.log("I am in the BubblyWaterList. Here is my data, ", data);
  console.log("sorted bubbly waters", sortedBubblyWaters);

  return (
    <>
      {data ? (
        <div>
          <div>
            <h3 className="lg:text-5xl text-xl text-center py-2 mt-5 font-bold">
              {searchTerm ? (
                <span>
                  Top Rated{" "}
                  <span className={capitalizeSingleFlavor(searchTerm)}>
                    {formatBrands(searchTerm)}
                  </span>{" "}
                  Bubbly Waters
                </span>
              ) : (
                <div>Top Rated Bubbly Waters of All Time</div>
              )}
            </h3>
            <p className="text-md py-5 leading-8 text-gray-800"></p>
          </div>
          {sortedBubblyWaters.length > 0
            ? sortedBubblyWaters.map((bubblyWater, index) => (
                <BubblyWaterListItem key={index} bubblyWater={bubblyWater} />
              ))
            : data.bubblyWaters.map((bubblyWater, index) => (
                <BubblyWaterListItem key={index} bubblyWater={bubblyWater} />
              ))}
        </div>
      ) : (
        <h1>Loading</h1>
      )}
    </>
  );
}
