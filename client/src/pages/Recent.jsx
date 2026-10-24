import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { QUERY_RECENT_RATINGS_AND_REVIEWS } from "../../utils/queries";
import CustomColorRating from "../components/CustomColorRating";
import RecentReviews from "../components/RecentReviews";
export default function Recent() {
  const { data, loading, error } = useQuery(QUERY_RECENT_RATINGS_AND_REVIEWS);
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentRatings, setRecentRatings] = useState([]);

  useEffect(() => {
    // Each review arrives with the reviewer's own rating (server join), no searching needed
    setRecentRatings(data?.recentRatings);
    setRecentReviews(
      (data?.recentReviews || []).map((review) => ({
        bubblyWater: review.bubblyWater,
        reviewText: review.reviewText,
        user: review.user,
        rating: review.rating ? review.rating.rating : "",
      }))
    );
  }, [data]);

  return (
    data && (
      <section className="mt-20">
        <div>
          <h1 className="lg:text-3xl text-lg text-center mb-2">
            Recent Reviews
          </h1>
          <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
            {recentReviews &&
              recentReviews.map((review, index) => (
                <RecentReviews key={index} review={review} />
              ))}
          </div>
        </div>
        <div>
          <h1>Recent Ratings</h1>
        </div>
      </section>
    )
  );
}
