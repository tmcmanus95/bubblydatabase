import { useQuery } from "@apollo/client";
import { QUERY_ALL_BUBBLYS, QUERY_SINGLE_FLAVOR } from "../../utils/queries";
import BubblyWaterListItem from "./BubblyWaterListItem";
import { averageRatingWeighting } from "../../utils/averageRatingWeighting";
import { useState } from "react";
import { formatBrands } from "../../utils/formatBrands";
import Loading from "./Loading";
import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";
export default function BubblyWaterList({ searchTerm }) {
  const { error, data } = searchTerm
    ? useQuery(QUERY_SINGLE_FLAVOR, { variables: { flavor: searchTerm } })
    : useQuery(QUERY_ALL_BUBBLYS);
  const [searchAll, setSearchAll] = useState(false);
  const [caffeineSearch, setCaffeineSearch] = useState(false);
  const [CBDSearch, setCBDSearch] = useState(false);

  let sortedBubblyWaters = [];
  let cbdBubblies;
  let caffeinatedBubblies;
  let hasCaffeinatedBubbly = false;
  let hasCBDBubbly = false;
  let generalWaters = [];
  const toggleCBDSearch = () => {
    if (caffeineSearch == true) {
      setCaffeineSearch(false);
    }
    setCBDSearch(true);
  };
  const toggleCaffeineSearch = () => {
    if (CBDSearch == true) {
      setCBDSearch(false);
    }
    setCaffeineSearch(true);
  };
  const toggleSearchAll = () => {
    if (CBDSearch == true) {
      setCBDSearch(false);
    } else if (caffeineSearch == true) {
      setCaffeineSearch(false);
    }
    setSearchAll(true);
  };

  // We only need to sort the single flavor query, as the QUERY_ALL_BUBBLYS resolver already returns the bubbly waters sorted by average rating
  if (searchTerm) {
    if (data && data.flavors) {
      sortedBubblyWaters = data.flavors
        .slice()
        .sort((a, b) => b.averageRating - a.averageRating);
      averageRatingWeighting(sortedBubblyWaters);
      cbdBubblies = data?.flavors.filter((bubbly) => bubbly?.hasCBD === true);
      caffeinatedBubblies = data?.flavors.filter(
        (bubbly) => bubbly?.isCaffeinated === true
      );
    }
  } else {
    if (data && data.bubblyWaters) {
      generalWaters = data.bubblyWaters
        .slice()
        .sort((a, b) => b.averageRating - a.averageRating);
    }
    cbdBubblies = data?.bubblyWaters.filter(
      (bubbly) => bubbly?.hasCBD === true
    );
    caffeinatedBubblies = data?.bubblyWaters.filter(
      (bubbly) => bubbly?.isCaffeinated === true
    );
    averageRatingWeighting(generalWaters);
  }

  if (CBDSearch) {
    if (cbdBubblies?.length > 0) {
      sortedBubblyWaters = cbdBubblies;
      hasCBDBubbly = true;
    } else {
      if (searchTerm) {
        sortedBubblyWaters = data?.flavors
          .slice()
          .sort((a, b) => b.averageRating - a.averageRating);
        hasCBDBubbly = false;
      } else {
        sortedBubblyWaters = data.bubblyWaters
          .slice()
          .sort((a, b) => a.averageRating - b.averageRating);
        hasCBDBubbly = false;
      }
    }
  }
  if (caffeineSearch) {
    if (caffeinatedBubblies?.length > 0) {
      sortedBubblyWaters = caffeinatedBubblies;
      hasCaffeinatedBubbly = true;
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
              ? `${capitalizeSingleFlavor(
                  searchTerm
                )}-background border-2 border-black mt-2 `
              : "mb-20"
          }
        >
          <div className="text-center pt-10">
            <h3 className="md:text-5xl text-xl text-center font-bold mb-6 relative">
              {searchTerm ? (
                <span>
                  Top Rated{" "}
                  <span className={capitalizeSingleFlavor(searchTerm)}>
                    {formatBrands(searchTerm)}
                  </span>{" "}
                  Bubbly Waters
                </span>
              ) : (
                <div className="md:text-5xl text-3xl text-center  font-bold">
                  Top 50 Bubbly Waters of All Time
                </div>
              )}
            </h3>
            {hasCaffeinatedBubbly ? (
              <h3 className="mt-4 text-xl">with Caffeine</h3>
            ) : (
              <></>
            )}
            {hasCBDBubbly ? <h3 className="mt-4 text-xl">with CBD</h3> : <></>}
            {caffeineSearch ? (
              hasCaffeinatedBubbly ? (
                <></>
              ) : (
                <h6 className="md:text-m text-sm">
                  No Caffeinated {formatBrands(searchTerm)} Waters Found
                </h6>
              )
            ) : (
              <></>
            )}

            {CBDSearch ? (
              hasCBDBubbly ? (
                <></>
              ) : (
                <h6 className="md:text-m text-sm">
                  No {formatBrands(searchTerm)} Flavored Waters with CBD Found
                </h6>
              )
            ) : (
              <></>
            )}
            <div className="flex justify-center mt-5">
              <div className="flex items-center pt-3">
                <div className="flex items-center mr-2">
                  <input
                    id="default-radio-1"
                    type="radio"
                    value=""
                    onClick={toggleSearchAll}
                    name="default-radio"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="default-radio-1"
                    className="ms-1 text-sm font-medium text-gray-900 "
                  >
                    All
                  </label>
                </div>
                <div className="flex items-center mr-2">
                  <input
                    id="default-radio-2"
                    type="radio"
                    value=""
                    onClick={toggleCBDSearch}
                    name="default-radio"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="default-radio-2"
                    className="ms-1 text-sm font-medium text-gray-900 "
                  >
                    CBD
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="default-radio-3"
                    type="radio"
                    value=""
                    onClick={toggleCaffeineSearch}
                    name="default-radio"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="default-radio-2"
                    className="ms-1 text-sm font-medium text-gray-900 "
                  >
                    Caffeine
                  </label>
                </div>
              </div>
            </div>

            <div className="absolute  left-1/2 transform -translate-x-1/2 mt-5 ">
              <div className="bg-black h-px w-56 lg:w-96"></div>
            </div>

            <p className="text-md  leading-8 text-gray-800"></p>
          </div>
          {sortedBubblyWaters.length > 0 ? (
            sortedBubblyWaters.map((bubblyWater, index) => (
              <BubblyWaterListItem
                key={index}
                bubblyWater={bubblyWater}
                ranking={index}
              />
            ))
          ) : generalWaters.length > 0 ? (
            generalWaters.map((bubblyWater, index) => (
              <BubblyWaterListItem
                key={index}
                bubblyWater={bubblyWater}
                ranking={index}
              />
            ))
          ) : (
            <Loading />
          )}
        </div>
      ) : (
        <Loading />
      )}
    </>
  );
}
