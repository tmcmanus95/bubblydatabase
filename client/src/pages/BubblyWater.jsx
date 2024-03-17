import { QUERY_MEID, QUERY_SINGLE_BUBBLYWATER } from "../../utils/queries";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import Rating from "@mui/material/Rating";
import { useState, useEffect } from "react";
import Auth from "../../utils/auth";
import { ADD_RATING, EDIT_RATING, ADD_REVIEW } from "../../utils/mutations";
import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
import { Link } from "react-router-dom";
import { formatBrands } from "../../utils/formatBrands";

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
  const userId = meIdData?.meId?._id;
  const bubblyWater = data?.bubblyWater;
  const flavors = bubblyWater ? capitalizeFlavors(bubblyWater) : [];
  let previouslyRated = false;
  let previouslyReviewed = false;
  let userRating = 0;
  let ratingId;
  let ratings = data?.bubblyWater?.ratings;
  let ratingsCount = data?.bubblyWater?.ratings.length;
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

  // const handleReviewValueChange = (e, newValue) => {
  //   setValue(newValue);
  //   if (previouslyReviewed) {
  //     console.log("edit review will happen here");
  //   } else {
  //     handleAddReview(e, newValue);
  //   }
  // };

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
    } catch (err) {
      console.log("error adding review", err);
    }
  };

  return (
    <>
      {bubblyWater ? (
        <>
          <div>
            <section className="m-5 flex justify-center">
              <div className="lg:flex gap-10">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-4 p-8 bg-yellow shadow-md rounded-lg">
                  <img
                    className="w-48 h-48 object-cover rounded-full lg:mr-10"
                    src={bubblyWater.imageURL}
                    alt={bubblyWater.productName}
                  />
                  <div className="lg:text-center">
                    <h1 className="text-3xl font-semibold m-5">
                      {formatBrands(bubblyWater.brandName)}
                    </h1>
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
              </div>
            </section>
          </div>

          <section className="m-5 text-center">
            <h2 className="text-2xl font-semibold">Ratings</h2>
            <ul>
              {bubblyWater.ratings.map((rating, index) => (
                <li key={index} className="border-solid">
                  <Link to={`/user/${rating.user._id}`}>
                    <span className="p-2 text-xl">{rating.user.username}</span>
                  </Link>
                  <span>
                    <Rating readOnly value={rating.rating} precision={0.5} />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="m-5 text-center">
            <h2 className="text-2xl font-semibold">Write a Review</h2>
            <section>
              <form
                onSubmit={(e) => handleAddReview(e)}
                className="mx-auto max-w-md"
              >
                <textarea
                  placeholder="Write a review"
                  name="reviewText"
                  className="w-full p-2 mt-4 border rounded"
                ></textarea>
                <button
                  type="submit"
                  className="block mx-auto mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Submit
                </button>
              </form>
            </section>
            <h2 className="text-2xl font-semibold">Reviews</h2>
            <ul className="mt-5">
              {bubblyWater.reviews.map((review, index) => (
                <li key={index} className="border-solid">
                  <Link to={`/user/${review.user._id}`}>
                    <span className="p-2 text-xl">{review.user.username}</span>
                  </Link>
                  <span>{review.reviewText}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <h1 className="text-2xl">Loading...</h1>
      )}
    </>
  );
}
