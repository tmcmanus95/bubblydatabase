import Rating from "@mui/material/Rating";
import { Link } from "react-router-dom";
export default function UsersRatings({ ratings }) {
  console.log(ratings);
  return (
    <section>
      <h3 className="m-5 flex justify-center">Recent Ratings</h3>
      <ul className="border-2 border-black p-5 flex-col flex items-center">
        {ratings?.map((rating, index) => (
          <Link to={`/bubblyWater/${rating.bubblyWater._id}`}>
            <li
              key={index}
              className="flex p-5 border-2 border-black items-center justify-between"
              style={{ width: "400px" }}
            >
              <div className="flex items-center">
                <img
                  className="w-10 h-20 object-cover rounded-full"
                  src={rating.bubblyWater.imageURL}
                  alt={rating.bubblyWater.productName}
                />
                <h1 className="flex items-center ml-3">
                  <span>{rating.bubblyWater.productName}</span>
                  <span> {rating.bubblyWater.brandName}</span>
                </h1>
              </div>
              <span className="text-2xl">
                <Rating readOnly size="small" value={rating.rating} />
              </span>
            </li>
          </Link>
        ))}
      </ul>
    </section>
  );
}
