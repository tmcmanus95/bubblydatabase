import BasicRating from "./FiveStarRating";
import { Link } from "react-router-dom";
import Rating from "@mui/material/Rating";
import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
import { formatBrands } from "../../utils/formatBrands";
export default function BubblyWaterListItem({ bubblyWater }) {
  const ratingCount = bubblyWater.ratings.length;
  const capitalizedFlavors = capitalizeFlavors(bubblyWater);

  return (
    <div className="bubblyListItem">
      <section className="m-5 flex justify-center">
        <div className="lg:flex gap-10 ">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-5 bg-white flex items-center">
            <Link to={`/bubblyWater/${bubblyWater._id}`}>
              <img
                src={bubblyWater.imageURL}
                className="mx-auto lg:mx-0"
                height={150}
                width={150}
              />
            </Link>
            <div className="text-left lg:text-center lg:ml-10">
              <h3 className="text-lg font-medium pt-8 pb-2">
                {formatBrands(bubblyWater.brandName)}
              </h3>
              <p className="py-2 mb-5">{bubblyWater.productName}</p>
              <h5>
                <span>Flavors: </span>
                {capitalizedFlavors.map((flavor, index) => (
                  <Link to={`/flavors/${flavor.toLowerCase()}`}>
                    <span key={index} className={flavor}>
                      {flavor.replace(/-/g, " ")}
                    </span>
                  </Link>
                ))}
              </h5>
              <h5 className="p-2">
                Average rating: {bubblyWater.averageRating} / 5.0
              </h5>
              <Link to={`/bubblyWater/${bubblyWater._id}`}>
                <Rating
                  readOnly
                  value={bubblyWater.averageRating}
                  precision={0.1}
                />

                <span>({ratingCount} ratings)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
