import BasicRating from "./FiveStarRating";
import { Link } from "react-router-dom";

export default function BubblyWaterListItem({ bubblyWater }) {
  return (
    <div>
      <Link to={bubblyWater._id}>
        <h1>{bubblyWater.brandName}</h1>
        <h2>{bubblyWater.productName}</h2>
        <h5>{bubblyWater.flavor}</h5>
        <img src={bubblyWater.imageURL}></img>
        <BasicRating />
      </Link>
    </div>
  );
}
