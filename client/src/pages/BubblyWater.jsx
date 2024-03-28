import { QUERY_MEID, QUERY_SINGLE_BUBBLYWATER } from "../../utils/queries";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import Rating from "@mui/material/Rating";
import { useState, useEffect } from "react";
import Auth from "../../utils/auth";
import {
  ADD_RATING,
  EDIT_RATING,
  ADD_REVIEW,
  EDIT_REVIEW,
} from "../../utils/mutations";
import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
import { Link } from "react-router-dom";
import { formatBrands } from "../../utils/formatBrands";
import Loading from "../components/Loading";

export default function BubblyWaterPage() {
  const { bubblyWaterId } = useParams();
  const [value, setValue] = useState(0);
  const { data, error } = useQuery(QUERY_SINGLE_BUBBLYWATER, {
    variables: { bubblyWaterId },
  });
  console.log("here is my sibngle bubbly data, ", data);
  const { data: meIdData, error: meIdError } = useQuery(QUERY_MEID);
  const [addRating, { error: addRatingError }] = useMutation(ADD_RATING);
  const [editRating, { error: editRatingError }] = useMutation(EDIT_RATING);
  const [addReview, { error: addReviewError }] = useMutation(ADD_REVIEW);
  const [editReview, { error: editReviewError }] = useMutation(EDIT_REVIEW);
  const userId = meIdData?.meId?._id;
  const bubblyWater = data?.bubblyWater;
  const flavors = bubblyWater ? capitalizeFlavors(bubblyWater) : [];
  let previouslyRated = false;
  let previouslyReviewed = false;
  let userRating = 0;
  let userReview = "";
  let ratingId;
  let reviewId;
  let ratings = data?.bubblyWater?.ratings;
  let ratingsCount = data?.bubblyWater?.ratings.length;
  let reviews = data?.bubblyWater?.reviews;

  console.log("reviews", reviews);
  // Check if user has already rated bubbly water
  if (ratings && ratings.length > 0) {
    for (let i = 0; i < ratings.length; i++) {
      if (ratings[i]?.user?._id === userId) {
        userRating = ratings[i].rating;
        ratingId = ratings[i]._id;
        previouslyRated = true;
      }
    }
  }

  // Check if the user has already reviewed bubbly Water
  if (reviews && reviews.length > 0) {
    for (let i = 0; i < reviews.length; i++) {
      if (reviews[i]?.user?._id === userId) {
        userReview = reviews[i].reviewText;
        reviewId = reviews[i]._id;
        previouslyReviewed = true;
        console.log("here is the reviewId, ", reviewId);
        console.log("here is the userReview", userReview);
        console.log("the previouslyReviewed value is ", previouslyReviewed);
      }
    }
  }

  useEffect(() => {}, [value, previouslyRated]);

  const handleValueChange = (e, newValue) => {
    setValue(newValue);
    if (previouslyRated) {
      handleEditRating(e, newValue);
    } else {
      handleAddRating(e, newValue);
    }
  };

  const handleEditRating = async (e, newValue) => {
    e.preventDefault();
    try {
      const { data } = await editRating({
        variables: {
          rating: newValue,
          ratingId: ratingId,
        },
      });
      previouslyRated = true;
    } catch (err) {
      console.error(err);
    }
  };
  const handleAddRating = async (e, newValue) => {
    e && e.preventDefault();

    try {
      const { data } = await addRating({
        variables: {
          rating: newValue,
          userId: userId,
          bubblyWaterId: bubblyWaterId,
        },
      });
      previouslyRated = true;
      console.log(previouslyRated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewValueChange = (e) => {
    if (previouslyReviewed) {
      handleEditReview(e);
    } else {
      handleAddReview(e);
    }
  };

  const handleAddReview = async (e) => {
    e && e.preventDefault();
    try {
      const reviewText = e.target.reviewText.value;
      const { data } = await addReview({
        variables: {
          bubblyWaterId: bubblyWaterId,
          userId: userId,
          reviewText: reviewText,
        },
      });

      previouslyReviewed = true;
    } catch (err) {
      console.log("error adding review", err);
    }
  };

  const handleEditReview = async (e) => {
    e.preventDefault();
    const reviewText = e.target.reviewText.value;
    console.log("This is my review text, ", reviewText);
    try {
      const { data } = await editReview({
        variables: {
          reviewText: reviewText,
          reviewId: reviewId,
        },
      });
      console.log("edit review data", data);
      previouslyReviewed = true;
    } catch (err) {
      console.error("Error editing review, ", err);
    }
  };

  return (
    <>
      {bubblyWater ? (
        <>
          <div>
            <div className="flex justify-center flex-col lg:flex-row">
              <section className="m-5 flex flex-col items-center sm:flex-row sm:justify-center gap-10">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-4 p-8 bg-yellow shadow-md rounded-lg">
                  <img
                    className="object-cover rounded-full lg:mr-10 w-48 md:w-96 lg:w-96 lg:h-96 md:h-96"
                    src={bubblyWater.imageURL}
                    alt={bubblyWater.productName}
                  />
                  <div className="text-center">
                    <Link to={`/brands/${bubblyWater.brandName}`}>
                      <h1 className="text-3xl font-semibold m-5">
                        {formatBrands(bubblyWater.brandName)}
                      </h1>
                    </Link>
                    <h2 className="text-xl">{bubblyWater.productName}</h2>
                    <h3 className="text-lg">Flavors:</h3>
                    <h4 className="text-base m-5">
                      {flavors.map((flavor, index) => (
                        <Link
                          to={`/flavors/${flavor.toLowerCase()}`}
                          key={index}
                        >
                          <span className={flavor}>{flavor} </span>
                        </Link>
                      ))}
                    </h4>
                    <h3 className="text-lg">
                      Average Rating: {bubblyWater.averageRating.toFixed(2)}{" "}
                      <span className="text-gray-500">({ratingsCount})</span>
                    </h3>
                    {Auth.loggedIn() ? (
                      <Rating
                        value={previouslyRated ? userRating : value}
                        defaultValue={userRating}
                        precision={0.5}
                        onChange={(e, newValue) => {
                          handleValueChange(e, newValue);
                        }}
                      />
                    ) : (
                      <Rating
                        readOnly
                        value={previouslyRated ? userRating : value}
                        defaultValue={userRating}
                        precision={0.5}
                        onChange={(e, newValue) => {
                          handleValueChange(e, newValue);
                        }}
                      />
                    )}
                  </div>
                </div>
              </section>
              <section className="m-5 mx-20 mt-10 text-center">
                <h2 className="text-2xl font-semibold mb-4">Write a Review</h2>
                <section className="mx-auto max-w-md">
                  <form onSubmit={(e) => handleReviewValueChange(e)}>
                    <textarea
                      name="reviewText"
                      className="w-full p-4 border rounded-md focus:outline-none focus:ring focus:border-blue-500"
                      placeholder="Write your review here..."
                      rows="4"
                    ></textarea>
                    <button
                      type="submit"
                      className="block w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-500"
                    >
                      {previouslyReviewed ? "Edit Review" : "Submit"}
                    </button>
                  </form>
                </section>
              </section>
            </div>
          </div>
          <section className="m-5 text-center flex justify-center flex-col lg:flex-row">
            <section>
              <h2 className="text-2xl font-semibold">Ratings</h2>
              <section>
                <ul className="p-5 flex-col flex items-center">
                  {bubblyWater.ratings?.map((rating, index) => (
                    <li
                      key={index}
                      className="flex border-2 border-black items-center justify-between w-64 md:w-96 lg:w-96 bg-gray-100 hover:bg-gray-200"
                    >
                      <div className="flex  items-center">
                        <div className="rounded-full justify-center align-center bg-red-300 littleCircle mr-3 ">
                          <Link to={`/user/${rating.user._id}`}>
                            <span>{rating.user.username[0].toUpperCase()}</span>
                          </Link>
                        </div>
                        <Link to={`/user/${rating.user._id}`}>
                          <h1>{rating.user.username}</h1>
                        </Link>
                      </div>
                      <span className="text-2xl">
                        <Rating
                          readOnly
                          size="small"
                          value={rating.rating}
                          precision={0.5}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </section>
            <section>
              <h2 className="text-2xl font-semibold">Reviews</h2>
              <ul className="p-5 flex-col flex items-center ">
                {bubblyWater.reviews?.map((review, index) => (
                  <Link to={`/user/${review.user._id}`}>
                    <li
                      key={index}
                      className="bg-white w-64 md:w-96 lg:w-96 rounded-lg mb-5"
                    >
                      <div className="bg-blue-200 rounded-t-lg p-2 flex items-center justify-between">
                        <span class="text-gray-800 font-semibold">
                          {review.user.username}
                        </span>
                        <div class="text-yellow-400">
                          <Rating
                            readOnly
                            size="small"
                            value={review.rating}
                            precision={0.5}
                          />
                        </div>
                      </div>
                      <div class="mt-4 px-2">
                        <p class="text-gray-700 ml-2 text-left pb-2">
                          {review.reviewText}
                        </p>
                      </div>
                    </li>
                  </Link>
                ))}
              </ul>
            </section>
          </section>
        </>
      ) : (
        <Loading />
      )}
    </>
  );
}
