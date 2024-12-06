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
    console.log("recent data", data);
    let tempReviewWithRatingArray = [];
    let bubblyWaterRating = "";

    for (let i = 0; i < data?.recentReviews.length; i++) {
      for (
        let j = 0;
        j < data?.recentReviews[i].bubblyWater.ratings.length;
        j++
      ) {
        if (
          data?.recentReviews[i].user._id ==
          data?.recentReviews[i].bubblyWater.ratings[j].user._id
        ) {
          bubblyWaterRating =
            data?.recentReviews[i].bubblyWater.ratings[j].rating;
        }
      }
      let tempRatingWithReviewObj = {
        bubblyWater: data?.recentReviews[i].bubblyWater,
        reviewText: data?.recentReviews[i].reviewText,
        user: data?.recentReviews[i].user,
        rating: bubblyWaterRating,
      };
      tempReviewWithRatingArray.push(tempRatingWithReviewObj);
    }
    setRecentRatings(data?.recentRatings);
    setRecentReviews(tempReviewWithRatingArray);
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
