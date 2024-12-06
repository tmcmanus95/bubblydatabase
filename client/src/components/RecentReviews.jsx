import CustomColorRating from "./CustomColorRating";
import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
import { formatBrands } from "../../utils/formatBrands";
import { Link } from "react-router-dom";
export default function RecentReviews({ review }) {
  const capitalizedFlavors = capitalizeFlavors(review.bubblyWater);
  if (capitalizedFlavors) {
    console.log("capitalizedflavors,", capitalizedFlavors);
  }
  return (
    <div
      className={`${capitalizedFlavors[0]}-background  flex flex-row border-2 border-black dark:border-white justify-between m-2`}
    >
      <div className="flex flex-row  border-white">
        <div className="flex flex-row p-5 basis-1/2">
          <Link to={`/bubblyWater/${review.bubblyWater._id}`}>
            <img
              className="mx-auto lg:mx-0 lg:mb-0 object-cover lg:w-32 lg:h-32 h-32 w-16 dark:rounded-lg"
              src={review.bubblyWater.imageURL}
            />
          </Link>
          <div className="flex flex-col ml-4">
            <div className="p-2">{review.bubblyWater.productName}</div>
            <div className="p-2">
              <Link to={`/brands/${review.bubblyWater.brandName}`}>
                {formatBrands(review.bubblyWater.brandName)}
              </Link>
            </div>

            {capitalizedFlavors.map((flavor, index) => (
              <div className="my-2 truncate lg:text-lg text-sm rounded-md lg:rounded-lg">
                <Link to={`/flavors/${flavor.toLowerCase()}`} key={index}>
                  <span className={`${flavor} whitespace-nowrap text-center`}>
                    {flavor.replace(/-/g, " ")}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-start   p-5 basis-1/2">
          <div className="text-left">
            <CustomColorRating
              flavor={capitalizedFlavors[0]}
              rating={review.rating}
            />
          </div>
          <div className="text-left break-words mt-4">{review.reviewText}</div>
          <Link to={`/user/${review.user._id}`}>
            <h3 className="text-right mt-auto">{review.user.username}</h3>
          </Link>
        </div>
      </div>
    </div>
  );
}
