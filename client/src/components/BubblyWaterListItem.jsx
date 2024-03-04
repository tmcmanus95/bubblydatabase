import BasicRating from "./FiveStarRating";
import { Link } from "react-router-dom";
import Rating from "@mui/material/Rating";
import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
export default function BubblyWaterListItem({ bubblyWater }) {
  const ratingCount = bubblyWater.ratings.length;

  const capitalizedFlavors = capitalizeFlavors(bubblyWater);
  return (
    <div>
      <section className="m-5">
        <Link to={`bubblyWater/${bubblyWater._id}`}>
          <div className="lg:flex gap-10">
            <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10 bg-white">
              <img
                width={100}
                height={100}
                src={bubblyWater.imageURL}
                className="mx-auto"
              />
              <h3 className="text-lg font-medium pt-8 pb-2">
                {bubblyWater.brandName}
              </h3>
              <p className="py-2">{bubblyWater.productName}</p>
              <h5>
                {capitalizedFlavors.map((flavor, index) => (
                  <span key={index} className={flavor}>
                    {flavor}{" "}
                  </span>
                ))}
              </h5>
              <h5>Average rating: {bubblyWater.averageRating} / 5.0</h5>
              <Rating
                readOnly
                value={bubblyWater.averageRating}
                precision={0.1}
              />{" "}
              <span>({ratingCount} ratings)</span>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
