import Rating from "@mui/material/Rating";
import { Link } from "react-router-dom";
import { formatBrands } from "../../utils/formatBrands";

export default function UsersRatings({ ratings }) {
  console.log(ratings);
  return (
    <section className="">
      <h3 className="m-5 flex justify-center">Recent Ratings</h3>
      <ul className=" p-5 flex-col flex items-center">
        {ratings?.map((rating, index) => (
          <Link to={`/bubblyWater/${rating.bubblyWater._id}`}>
            <li
              key={index}
              className="flex w-64 md:w-96 border-2 border-black items-center justify-between bg-gray-100 hover:bg-gray-200 lg:text-md text-xs"
            >
              <div className="flex items-center">
                <img
                  className="w-10 h-20 object-cover rounded-full"
                  src={rating.bubblyWater.imageURL}
                  alt={rating.bubblyWater.productName}
                />
                <h1 className="flex items-center ml-3 overflow-hidden">
                  <span className="w-20">{rating.bubblyWater.productName}</span>
                  <span className="m-3">
                    {formatBrands(rating.bubblyWater.brandName)}
                  </span>
                </h1>
              </div>
              <Rating
                readOnly
                size="small"
                value={rating.rating}
                className="userRatingElement"
              />
            </li>
          </Link>
        ))}
      </ul>
    </section>
  );
}
