import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
export default function RecentReviews({ review }) {
  const capitalizedFlavors = capitalizeFlavors(review.bubblyWater);
  return (
    <div
      className={`${capitalizedFlavors[0]}-background  flex flex-row border-2 border-black dark:border-white justify-between m-2`}
    >
      <div className="flex flex-row  border-white">
        <div className="p-5 basis-1/2 min-w-0">
          <ProductCard
            bubblyWater={review.bubblyWater}
            variant="compact"
            score={typeof review.rating === "number" ? review.rating : undefined}
            scoreDetail="rated"
            showScore={typeof review.rating === "number"}
          />
        </div>

        <div className="flex flex-col justify-start   p-5 basis-1/2">
          <div className="text-left break-words">{review.reviewText}</div>
          <Link to={`/user/${review.user._id}`}>
            <h3 className="text-right mt-auto">{review.user.username}</h3>
          </Link>
        </div>
      </div>
    </div>
  );
}
