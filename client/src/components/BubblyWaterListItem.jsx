import BasicRating from "./FiveStarRating";
import { Link } from "react-router-dom";
import Rating from "@mui/material/Rating";
import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
export default function BubblyWaterListItem({ bubblyWater }) {
  const ratingCount = bubblyWater.ratings.length;
  console.log(bubblyWater);

  const capitalizedFlavors = capitalizeFlavors(bubblyWater);
  return (
    <div>
      <Link to={bubblyWater._id}>
        <h1>{bubblyWater.brandName}</h1>
        <h2>{bubblyWater.productName}</h2>
        <h5>
          {capitalizedFlavors.map((flavor, index) => (
            <span key={index}>{flavor} </span>
          ))}
        </h5>
        <img src={bubblyWater.imageURL}></img>
        <Rating readOnly value={bubblyWater.averageRating} />{" "}
        <span>({ratingCount} ratings)</span>
      </Link>
    </div>
  );
}
