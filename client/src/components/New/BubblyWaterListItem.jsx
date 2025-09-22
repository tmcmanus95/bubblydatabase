import BubblyWaterListReview from "./BubblyWaterListReview";
import CustomColorRating from "../CustomColorRating";
import { capitalizeFlavors } from "../../../utils/capitalizeFlavors";
import { formatBrands } from "../../../utils/formatBrands";
import { Link } from "react-router-dom";
export default function BubblyWaterListItem({ bubblyWater }) {
  const capitalizedFlavors = capitalizeFlavors(bubblyWater);

  return (
    <div className="flex flex-row justify-center">
      <div
        className={`${capitalizedFlavors[0]}-border transition-shadow flex flex-row border-solid border-2 border-gray-300 w-full sm:w-2/3`}
      >
        <div className="flex flex-col">
          <img
            src={bubblyWater.imageURL}
            alt={bubblyWater.productName}
            className="mx-auto lg:mx-0 lg:mb-0 object-cover w-40 h-52 dark:rounded-lg"
          />
          <button
            className={`mt-4 ${capitalizedFlavors[0]}-border ${
              capitalizedFlavors.length > 1
                ? `${capitalizedFlavors[1]}-shadow`
                : `${capitalizedFlavors[0]}-shadow`
            }`}
          >
            Buy
          </button>
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex flex-row">
            <div>{formatBrands(bubblyWater.brandName)}</div>
            <div>{bubblyWater.productName}</div>
          </div>
          <div className="flex flex-wrap max-w-[14rem] justify-center ">
            {capitalizedFlavors.map((flavor, index) => (
              <Link to={`/flavors/${flavor.toLowerCase()}`} key={index}>
                <span
                  className={`${flavor} whitespace-nowrap text-center ${flavor}-shadow`}
                >
                  {flavor.replace(/-/g, " ")}
                </span>
              </Link>
            ))}
          </div>
          <div>Average Rating: {bubblyWater.averageRating.toFixed(2)}</div>
          <div className="flex justify-center">
            <CustomColorRating
              flavor={capitalizedFlavors[0]}
              rating={bubblyWater.averageRating}
              bubblyWaterId={bubblyWater._id}
              // userId={userId}
              // isVerified={isVerified}
            />
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <BubblyWaterListReview bubblyWater={bubblyWater} />
      </div>
    </div>
  );
}
