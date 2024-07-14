import Rating from "@mui/material/Rating";
import { Link } from "react-router-dom";
import { formatBrands } from "../../utils/formatBrands";
import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";
import CustomColorRating from "./CustomColorRating";

export default function UsersRatings({ ratings, userId, isVerified }) {
  return (
    <section className="">
      <ul className="p-5 flex-col flex items-center">
        {ratings?.map((rating, index) => (
          <Link to={`/bubblyWater/${rating.bubblyWater._id}`}>
            <li
              key={index}
              className={`${capitalizeSingleFlavor(
                rating.bubblyWater.flavor[0]
              )}-background flex w-64 md:w-96 border-2 border-black items-center justify-between hover:bg-blue-300 lg:text-md text-xs`}
            >
              <div className="flex items-center">
                <img
                  className="w-10 h-20 object-cover rounded-full"
                  src={rating.bubblyWater.imageURL}
                  alt={rating.bubblyWater.productName}
                />
                <h1 className="flex flex-col ml-3 overflow-hidden justi">
                  <span className="">{rating.bubblyWater.productName}</span>
                  <span className="">
                    {formatBrands(rating.bubblyWater.brandName)}
                  </span>
                </h1>
              </div>
              <div className="overflow-hidden">
                {/* <Rating
                  readOnly
                  size="small"
                  value={rating.rating}
                  className="userRatingElement"
                  precision={0.5}
                /> */}
                <CustomColorRating
                  flavor={rating.bubblyWater.flavor[0]}
                  size={"small"}
                  readOnly
                  rating={rating.rating}
                  bubblyWaterId={rating.bubblyWater._id}
                  userId={userId}
                  isVerified={isVerified}
                />
              </div>
            </li>
          </Link>
        ))}
      </ul>
    </section>
  );
}
