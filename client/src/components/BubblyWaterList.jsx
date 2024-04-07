import { useQuery } from "@apollo/client";
import { QUERY_ALL_BUBBLYS, QUERY_SINGLE_FLAVOR } from "../../utils/queries";
import BubblyWaterListItem from "./BubblyWaterListItem";
import { useState } from "react";
import { formatBrands } from "../../utils/formatBrands";
import Loading from "./Loading";
import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";
export default function BubblyWaterList({
  searchTerm,
  CBDSearch,
  caffeineSearch,
}) {
  const { error, data } = searchTerm
    ? useQuery(QUERY_SINGLE_FLAVOR, { variables: { flavor: searchTerm } })
    : useQuery(QUERY_ALL_BUBBLYS);
  let sortedBubblyWaters = [];
  let cbdBubblies;
  let caffeinatedBubblies;
  let hasCaffeinatedBubbly = true;
  let hasCBDBubbly = true;

  // We only need to sort the single flavor query, as the QUERY_ALL_BUBBLYS resolver already returns the bubbly waters sorted by average rating
  if (searchTerm) {
    if (data && data.flavors) {
      sortedBubblyWaters = data.flavors
        .slice()
        .sort((a, b) => b.averageRating - a.averageRating);

      cbdBubblies = data?.flavors.filter((bubbly) => bubbly?.hasCBD === true);
      caffeinatedBubblies = data?.flavors.filter(
        (bubbly) => bubbly?.isCaffeinated === true
      );
    } else {
      cbdBubblies = data?.bubblyWater.filter(
        (bubbly) => bubbly?.hasCBD === true
      );
      caffeinatedBubblies = data?.bubblyWater.filter(
        (bubbly) => bubbly?.isCaffeinated === true
      );
    }
  }

  if (CBDSearch) {
    if (cbdBubblies?.length > 0) {
      sortedBubblyWaters = cbdBubblies;
    } else {
      sortedBubblyWaters = data?.flavors
        .slice()
        .sort((a, b) => b.averageRating - a.averageRating);
      hasCBDBubbly = false;
    }
  }
  if (caffeineSearch) {
    if (caffeinatedBubblies?.length > 0) {
      sortedBubblyWaters = caffeinatedBubblies;
    } else {
      sortedBubblyWaters = data?.flavors
        .slice()
        .sort((a, b) => b.averageRating - a.averageRating);
      hasCaffeinatedBubbly = false;
    }
  }
  return (
    <>
      {data ? (
        <div
          className={
            searchTerm
              ? `${capitalizeSingleFlavor(searchTerm)}-background mb-20`
              : "mb-20"
          }
        >
          <div className="text-center pt-5">
            {hasCaffeinatedBubbly ? (
              <></>
            ) : (
              <h6>
                No Caffeinated {capitalizeSingleFlavor(searchTerm)} Waters Found
              </h6>
            )}
            {hasCBDBubbly ? (
              <></>
            ) : (
              <h6>
                No {capitalizeSingleFlavor(searchTerm)} Flavored Waters with CBD
                Found
              </h6>
            )}

            <h3 className="md:text-5xl text-xl text-center pt-10 font-bold mb-6 relative">
              {searchTerm ? (
                <span>
                  Top Rated{" "}
                  <span className={capitalizeSingleFlavor(searchTerm)}>
                    {formatBrands(searchTerm)}
                  </span>{" "}
                  Bubbly Waters
                </span>
              ) : (
                <div className="md:text-5xl text-3xl text-center pt-10 font-bold">
                  Top Rated Bubbly Waters of All Time
                </div>
              )}
              <div className="absolute  left-1/2 transform -translate-x-1/2 mt-5 ">
                <div className="bg-black h-px w-56 lg:w-96"></div>
              </div>
            </h3>
            <p className="text-md  leading-8 text-gray-800"></p>
          </div>
          {sortedBubblyWaters.length > 0
            ? sortedBubblyWaters.map((bubblyWater, index) => (
                <BubblyWaterListItem
                  key={index}
                  bubblyWater={bubblyWater}
                  ranking={index}
                />
              ))
            : data.bubblyWaters.map((bubblyWater, index) => (
                <BubblyWaterListItem
                  key={index}
                  bubblyWater={bubblyWater}
                  ranking={index}
                />
              ))}
        </div>
      ) : (
        <Loading />
      )}
    </>
  );
}
