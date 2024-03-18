import BasicRating from "./FiveStarRating";
import { Link } from "react-router-dom";
import Rating from "@mui/material/Rating";
import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
import { formatBrands } from "../../utils/formatBrands";
export default function BubblyWaterListItem({ bubblyWater }) {
  let ratingCount = 0;
  console.log("I am in the BubblyWaterListItem, here is my data", bubblyWater);
  const capitalizedFlavors = capitalizeFlavors(bubblyWater);
  if (bubblyWater.ratings.length) {
    ratingCount = bubblyWater?.ratings?.length;
  }
  return (
    <div class="bubblyListItem">
      <section class="m-2 md:m-5 flex justify-center">
        <div class="lg:flex flex-col lg:flex-row gap-5">
          <div class="shadow-lg p-5 rounded-xl my-5 bg-white lg:flex lg:items-start">
            <Link
              to={`/bubblyWater/${bubblyWater._id}`}
              class="flex justify-center lg:mr-5"
            >
              <img
                src={bubblyWater.imageURL}
                class="mx-auto lg:mx-0 lg:mb-0"
                style={{ width: "150px", height: "200px", objectFit: "cover" }}
              />
            </Link>
            <div class="flex flex-col justify-center">
              <Link to={`/brands/${bubblyWater.brandName}`}>
                <h3 class="text-lg font-medium pt-2 lg:pt-8 pb-2">
                  {formatBrands(bubblyWater.brandName)}
                </h3>
              </Link>
              <p class="py-2 mb-2 lg:mb-5">{bubblyWater.productName}</p>
              <h5 class="mb-2">
                <span>Flavors: </span>
                {capitalizedFlavors.map((flavor, index) => (
                  <Link to={`/flavors/${flavor.toLowerCase()}`} key={index}>
                    <span class={flavor}>{flavor.replace(/-/g, " ")}</span>
                  </Link>
                ))}
              </h5>
              <h5 class="mb-2 py-2">
                Average rating: {bubblyWater.averageRating} / 5.0
              </h5>
              <Link to={`/bubblyWater/${bubblyWater._id}`}>
                <Rating
                  readOnly
                  value={bubblyWater.averageRating}
                  precision={0.1}
                />
                <span>({ratingCount})</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
