import { Link } from "react-router-dom";
import { useState } from "react";
import { formatBrands } from "../../utils/formatBrands";
import { Rating } from "@mui/material";
import Auth from "../../utils/auth";
import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";
import { useMutation } from "@apollo/client";
import {
  ADD_LIKE_TO_REVIEW,
  REMOVE_LIKE_FROM_REVIEW,
} from "../../utils/mutations";
import { QUERY_MEID } from "../../utils/queries";
import CustomColorRating from "./CustomColorRating";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";

export default function UsersReviews({
  reviews,
  isVerified,
  userId,
  likedReviews,
  onLikeReview,
  onRemoveLikeReview,
}) {
  const [addLikeToReview] = useMutation(ADD_LIKE_TO_REVIEW);
  const [removeLikeFromReview] = useMutation(REMOVE_LIKE_FROM_REVIEW);

  const handleLikeReview = async (reviewId) => {
    if (!Auth.loggedIn()) {
      // toggleLoginReminder(); // You'll need to pass this down or handle differently
      return;
    }

    try {
      await addLikeToReview({
        variables: { reviewId: reviewId },
      });
      // Call parent's callback to update liked reviews
      onLikeReview?.(reviewId);
    } catch (err) {
      console.error("Error liking review:", err);
    }
  };
  const handleRemoveLikeReview = async (reviewId) => {
    if (!Auth.loggedIn()) {
      // toggleLoginReminder(); // You'll need to pass this down or handle differently
      return;
    }

    try {
      await removeLikeFromReview({
        variables: { reviewId: reviewId },
      });
      // Call parent's callback to update liked reviews
      onRemoveLikeReview?.(reviewId);
    } catch (err) {
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
                  {likedReviews.includes(review._id) ? (
                    <AiFillLike
                      className={`hover:cursor-pointer hover:text-green-500 ${
                        likedReviews.includes(review._id)
                          ? "text-blue-500"
                          : "text-gray-500"
                      }`}
                      size={25}
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveLikeReview(review._id);
                      }}
                    />
                  ) : (
                    <AiOutlineLike
                      className={`hover:cursor-pointer hover:text-green-500 ${
                        likedReviews.includes(review._id)
                          ? "bg-blue-500"
                          : "text-gray-500"
                      }`}
                      size={25}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLikeReview(review._id);
                      }}
                    />
                  )}
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
