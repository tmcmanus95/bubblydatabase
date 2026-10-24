import { Link } from "react-router-dom";
import Stars from "./Stars";

// How a user's ratings split across 5, 4.5 … 0.5 stars. `breakdown` comes counted from the server
// (User.ratingBreakdown), over all of the user's ratings, not just the ones the profile loads.
export default function RatingsBreakdown({ breakdown, userId }) {
  const total = breakdown.reduce((sum, b) => sum + b.count, 0);
  return (
    <div className="flex-col flex items-center ">
      <h3 className="mb-2">Ratings Breakdown</h3>
      {breakdown.map(({ rating, count }) => (
        <Link key={rating} to={`/user/${userId}/ratings/${rating}`}>
          <h2 className="flex w-64 md:w-96 border-2 border-black items-center justify-between lg:text-md text-xs">
            <span className="align-left">
              {rating} Stars: {count}
            </span>
            <span>{total ? ((count / total) * 100).toFixed(1) : "0.0"} %</span>
            <span className="rating-stars--small">
              <Stars value={rating} />
            </span>
          </h2>
        </Link>
      ))}
    </div>
  );
}
