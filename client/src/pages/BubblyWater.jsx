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
import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";
import { Link } from "react-router-dom";
import { formatBrands } from "../../utils/formatBrands";
import Loading from "../components/Loading";
import CustomColorRating from "../components/CustomColorRating";
export default function BubblyWaterPage() {
  const { bubblyWaterId } = useParams();
  const [value, setValue] = useState(0);
  const { data, error } = useQuery(QUERY_SINGLE_BUBBLYWATER, {
    variables: { bubblyWaterId },
  });
  const { data: meIdData, error: meIdError } = useQuery(QUERY_MEID);
  const [addRating, { error: addRatingError }] = useMutation(ADD_RATING);
  const [editRating, { error: editRatingError }] = useMutation(EDIT_RATING);
  const [addReview, { error: addReviewError }] = useMutation(ADD_REVIEW);
  const [editReview, { error: editReviewError }] = useMutation(EDIT_REVIEW);
  const [loginReminder, setLoginReminder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const userId = meIdData?.meId?._id;
  let isVerified = meIdData?.meId?.isVerified;
  const bubblyWater = data?.bubblyWater;
  const flavors = bubblyWater ? capitalizeFlavors(bubblyWater) : [];
  const [previouslyRated, setPreviouslyRated] = useState(false);
  const [previouslyReviewed, setPreviouslyReviewed] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [ratingId, setRatingId] = useState("");
  const [reviewId, setReviewId] = useState("");
  const [ratings, setRatings] = useState([]);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [reviews, setReviews] = useState([]);

  let capitalizedFlavors;
  if (bubblyWater) {
    capitalizedFlavors = capitalizeFlavors(bubblyWater);
  }

  // Check if user has already rated bubbly water

  useEffect(() => {
    for (let i = 0; i < ratings.length; i++) {
      if (ratings[i]?.user?._id === userId) {
        setUserRating(ratings[i].rating);
        setRatingId(ratings[i]._id);
        setPreviouslyRated(true);
      }
    }
  }, [ratings]);

  // Check if the user has already reviewed bubbly Water

  useEffect(() => {
    console.log("data", data);
    let tempReviewsWithRatingsArray = [];
    let rating = null;
    for (let i = 0; i < data?.bubblyWater?.reviews.length; i++) {
      if (reviews[i]?.user?._id === userId) {
        setUserReview(reviews[i]?.reviewText);
        setReviewId(reviews[i]?._id);
        setPreviouslyReviewed(true);
      }
    }
  }, [data]);

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
          bubblyWaterId: bubblyWaterId,
        },
      });
      setPreviouslyRated(true);
    } catch (err) {
      console.error("Error editing review, ", err);
    }
  };
  const handleAddRating = async (e, newValue) => {
    e && e.preventDefault();
    console.log("add rating bubbly water id", bubblyWaterId);
    setIsSubmitting(true);
    try {
      const { data } = await addRating({
        variables: {
          rating: newValue,
          userId: userId,
          bubblyWaterId: bubblyWaterId,
        },
      });
      setPreviouslyRated(true);
    } catch (err) {
      console.error("Error adding rating, ", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewValueChange = (e) => {
    if (previouslyReviewed) {
      handleEditReview(e);
    } else {
      handleAddReview(e);
    }
    setReviewText("");
  };

  const handleAddReview = async (e) => {
    e && e.preventDefault();
    let reviewText = e.target.reviewText.value;

    try {
      const { data } = await addReview({
        variables: {
          bubblyWaterId: bubblyWaterId,
          userId: userId,
          reviewText: reviewText,
        },
      });

      setPreviouslyReviewed(true);
    } catch (err) {
      console.log("Error adding review", err);
    }
  };
  const handleEditReview = async (e) => {
    e.preventDefault();
    let reviewText = e.target.reviewText.value;
    try {
      const { data } = await editReview({
        variables: {
          reviewText: reviewText,
          reviewId: reviewId,
        },
      });
      setPreviouslyReviewed(true);
    } catch (err) {
      console.error("Error editing review, ", err);
    }
  };
  const toggleLoginReminder = () => {
    setLoginReminder(!loginReminder);
  };
  console.log("reviews, ", reviews);

  return (
    <>
      {bubblyWater ? (
        <div
        // className={`${capitalizeSingleFlavor(
        //   bubblyWater.flavor[0]
        // )}-background`}
        >
          <div>
            <div className="flex justify-center flex-col lg:flex-row mt-14 ">
              <section className="m-5 flex flex-col items-center sm:flex-row sm:justify-center gap-10  rounded-lg">
                <div className="flex flex-col lg:flex-row items-center  justify-center gap-4 p-8 bg-yellow shadow-md rounded-lg">
                  <img
                    className="object-cover rounded-lg lg:mr-10 w-48 h-48 md:w-96 lg:w-96 lg:h-96 md:h-96"
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
                    <h3 className="text-lg font-bold mt-3">Flavors</h3>
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
                    {Auth.loggedIn() && !isVerified ? (
                      <div>
                        Please{" "}
                        <Link
                          className="text-blue-500"
                          to={`/resendEmailVerification`}
                        >
                          verify email
                        </Link>{" "}
                        to rate
                      </div>
                    ) : (
                      <></>
                    )}

                    {Auth.loggedIn() ? (
                      <CustomColorRating
                        value={previouslyRated ? userRating : value}
                        defaultValue={userRating}
                        bubblyWaterId={bubblyWaterId}
                        precision={0.5}
                        userId={userId}
                        size="large"
                        flavor={capitalizedFlavors[0]}
                        className="mt-3"
                        disabled={isSubmitting}
                        isVerified={isVerified}
                        onChange={(e, newValue) => {
                          handleValueChange(e, newValue);
                        }}
                      />
                    ) : (
                      <>
                        <CustomColorRating
                          readOnly
                          bubblyWaterId={bubblyWaterId}
                          value={previouslyRated ? userRating : value}
                          precision={0.5}
                          flavor={capitalizedFlavors[0]}
                          isVerified={isVerified}
                          userId={userId}
                        />
                        <p>
                          <Link to="/login" className="text-blue-500">
                            Login
                          </Link>{" "}
                          to rate this water!
                        </p>
                      </>
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
                      className="w-full p-4 border rounded-md focus:outline-none focus:ring focus:border-blue-500 text-black"
                      placeholder="Write your review here..."
                      readOnly={isVerified ? false : true}
                      rows="4"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    ></textarea>
                    {Auth.loggedIn() && !isVerified ? (
                      <div>
                        Please{" "}
                        <Link
                          className="text-blue-500"
                          to={`/resendEmailVerification`}
                        >
                          verify email
                        </Link>{" "}
                        to review
                      </div>
                    ) : (
                      <></>
                    )}
                    {Auth.loggedIn() ? (
                      <button
                        type="submit"
                        className={`${flavors[0]}-brushings block w-full mt-4 px-4 py-2  text-white rounded-md  focus:outline-none focus:ring`}
                      >
                        {previouslyReviewed ? "Edit Review" : "Submit"}
                      </button>
                    ) : (
                      <p>
                        <Link to="/login" className="text-blue-500">
                          Login
                        </Link>{" "}
                        to review this water!
                      </p>
                    )}
                  </form>
                </section>
              </section>
            </div>
          </div>
          <section className="mx-5 text-center flex justify-center flex-col lg:flex-row">
            <section>
              {bubblyWater?.ratings && bubblyWater?.ratings.length > 0 ? (
                <h2 className="text-2xl font-semibold text-decoration-line: underline underline-offset-8">
                  Ratings
                </h2>
              ) : (
                <></>
              )}
              <section>
                <ul className="p-5 flex-col flex items-center">
                  {bubblyWater.ratings?.map((rating, index) => (
                    <Link to={`/user/${rating?.user?._id}`}>
                      <li
                        key={index}
                        className={`${flavors[0]}-background flex border-2 border-black items-center justify-between w-72 md:w-96 lg:w-96 hover:bg-gray-200 dark:hover:bg-gray-950`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`rounded-full justify-center align-center littleCircle mr-3 text-black ${
                              rating?.user?.color
                                ? `${rating.user.color}`
                                : "bg-red-300"
                            }`}
                          >
                            <Link to={`/user/${rating?.user?._id}`}>
                              {rating?.user?.username ? (
                                <span>
                                  {rating?.user?.username[0].toUpperCase()}
                                </span>
                              ) : (
                                <></>
                              )}
                            </Link>
                          </div>
                          {rating?.user?.username ? (
                            <span className="text-gray-800 dark:text-white font-semibold text-xs md:text-md">
                              {rating.user.username}
                            </span>
                          ) : (
                            <span className="text-gray-800 dark:text-white font-semibold">
                              me
                            </span>
                          )}
                        </div>
                        <span className="text-2xl">
                          <CustomColorRating
                            readOnly
                            size="small"
                            flavor={bubblyWater?.flavor[0]}
                            rating={rating.rating}
                            precision={0.5}
                          />
                        </span>
                      </li>
                    </Link>
                  ))}
                </ul>
              </section>
            </section>
            <section className="mb-5">
              {bubblyWater?.reviews && bubblyWater?.reviews.length > 0 ? (
                <h2 className="text-2xl font-semibold text-decoration-line: underline underline-offset-8">
                  Reviews
                </h2>
              ) : (
                <></>
              )}
              <ul className="p-5 flex-col flex items-center ">
                {bubblyWater?.reviews?.map((review, index) => (
                  <Link to={`/user/${review?.user?._id}`}>
                    <li
                      key={index}
                      className="dark:bg-slate-900 w-72 md:w-96 lg:w-96 rounded-lg mb-5 border-2 border-black"
                    >
                      <div
                        className={`${flavors[0]}-background rounded-t-lg p-2 flex items-center justify-between`}
                      >
                        {review?.user?.username ? (
                          <span className=" font-semibold">
                            {review?.user?.username}
                          </span>
                        ) : (
                          <span className=" font-semibold">me</span>
                        )}
                        <div>
                          {review.rating ? (
                            <CustomColorRating
                              readOnly
                              size="small"
                              flavor={bubblyWater?.flavor[0]}
                              rating={review.rating.rating}
                              precision={0.5}
                            />
                          ) : (
                            <></>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 px-2">
                        <p className="text-gray-700 ml-2 text-left pb-2 dark:text-white">
                          {review.reviewText}
                        </p>
                      </div>
                    </li>
                  </Link>
                ))}
              </ul>
            </section>
          </section>
        </div>
      ) : (
        <Loading />
      )}
    </>
  );
}
