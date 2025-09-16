import { Link } from "react-router-dom";
import { useState } from "react";
import { formatBrands } from "../../utils/formatBrands";
import { Rating } from "@mui/material";
import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";
import { useMutation } from "@apollo/client";
import {
  ADD_LIKE_TO_REVIEW,
  REMOVE_LIKE_FROM_REVIEW,
} from "../../utils/mutations";
import { QUERY_MEID } from "../../utils/queries";
import CustomColorRating from "./CustomColorRating";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";

export default function UsersReviews({ reviews, isVerified }) {
  const [likedReviews, setLikedReviews] = useState([]);
  const [addLikeToReview] = useMutation(ADD_LIKE_TO_REVIEW, {
    refetchQueries: [{ query: QUERY_MEID }],
  });
  const [removeLikeFromReview] = useMutation(REMOVE_LIKE_FROM_REVIEW, {
    refetchQueries: [{ query: QUERY_MEID }],
  });
  const handleLikeReview = async (reviewId) => {
    if (!Auth.loggedIn()) {
      toggleLoginReminder();
      return;
    }

    // Optimistic update - update UI immediately
    setLikedReviews((prev) => [...prev, reviewId]);

    try {
      await addLikeToReview({
        variables: { userId: userId, reviewId: reviewId },
      });
      // The refetchQueries will handle updating the UI automatically
    } catch (err) {
      // Revert optimistic update on error
      setLikedReviews((prev) => prev.filter((id) => id !== reviewId));
      console.error("Error liking review:", err);
    }
  };
  const handleRemoveLikeReview = async (reviewId) => {
    if (!Auth.loggedIn()) {
      toggleLoginReminder();
      return;
    }

    // Optimistic update - update UI immediately
    setLikedReviews((prev) => prev.filter((id) => id !== reviewId));

    console.log("remove like from review id", reviewId);
    try {
      await removeLikeFromReview({
        variables: { userId: userId, reviewId: reviewId },
      });
      // The refetchQueries will handle updating the UI automatically
    } catch (err) {
      // Revert optimistic update on error
      setLikedReviews((prev) => [...prev, reviewId]);
      console.error("Error removing like from review:", err);
    }
  };

  console.log("reviews", reviews);
  return (
    <>
      <section>
        <ul className="p-5 flex-col flex items-center">
          {reviews?.map((review, index) => (
            <Link to={`/bubblyWater/${review?.bubblyWater._id}`} key={index}>
              <li className="border-2 w-64 md:w-96 mb-3 rounded-lg lg:text-l text-sm overflow-hidden">
                <div
                  className={`${
                    review?.bubblyWater?.flavor[0]
                      ? `${capitalizeSingleFlavor(
                          review.bubblyWater.flavor[0]
                        )}-background rounded-t-lg p-2 flex gap-3 items-center justify-between`
                      : ""
                  }`}
                >
                  <img
                    className="w-10 h-20 object-cover rounded-full flex-shrink-0"
                    src={review.bubblyWater.imageURL}
                    alt={review.bubblyWater.productName}
                  />
                  <div className="flex flex-col flex-grow">
                    <span className="overflow-hidden overflow-ellipsis">
                      {review.bubblyWater.productName}
                    </span>
                    <span className="overflow-hidden overflow-ellipsis">
                      {formatBrands(review.bubblyWater.brandName)}
                    </span>
                  </div>
                  <div>
                    {review.rating ? (
                      // <Rating
                      //   readOnly
                      //   size="small"
                      //   value={review.rating.rating}
                      //   precision={0.5}
                      // />
                      <CustomColorRating
                        flavor={review.bubblyWater.flavor[0]}
                        rating={review?.rating.rating}
                      />
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
                <div className="pt-2 p-1 bg-white dark:bg-blue-950 ">
                  <p className=" ml-2 text-left overflow-hidden overflow-ellipsis mb-2 ">
                    {review.reviewText}
                  </p>
                </div>
              </li>
            </Link>
          ))}
        </ul>
      </section>
    </>
  );
}
