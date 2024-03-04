import { QUERY_MEID, QUERY_SINGLE_BUBBLYWATER } from "../../utils/queries";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import Rating from "@mui/material/Rating";
import { useState, useEffect } from "react";
import Auth from "../../utils/auth";
import { ADD_RATING, EDIT_RATING } from "../../utils/mutations";
import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
import { Link } from "react-router-dom";
export default function BubblyWaterPage() {
  const { bubblyWaterId } = useParams();
  const [value, setValue] = useState(0);
  const { data, error } = useQuery(QUERY_SINGLE_BUBBLYWATER, {
    variables: { bubblyWaterId },
  });
  const { data: meIdData, error: meIdError } = useQuery(QUERY_MEID);
  const [addRating, { error: addRatingError }] = useMutation(ADD_RATING);
  const [editRating, { error: editRatingError }] = useMutation(EDIT_RATING);
  const userId = meIdData?.meId?._id;
  const bubblyWater = data?.bubblyWater;
  const flavors = bubblyWater ? capitalizeFlavors(bubblyWater) : [];
  let previouslyRated = false;
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

  console.log(bubblyWater?.ratings);

  return (
    <>
      {bubblyWater ? (
        <>
          <section className="m-5 flex justify-center">
            <div className="lg:flex gap-10">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-4 p-8 bg-yellow shadow-md rounded-lg">
                <img
                  className="w-48 h-48 object-cover rounded-full lg:mr-10"
                  src={bubblyWater.imageURL}
                  alt={bubblyWater.productName}
                />
                <div className="lg:text-center">
                  <h1 className="text-3xl font-semibold">
                    {bubblyWater.brandName}
                  </h1>
                  <h2 className="text-xl">{bubblyWater.productName}</h2>
                  <h3 className="text-lg">Flavors:</h3>
                  <h4 className="text-base">{flavors.join(", ")}</h4>
                  <h3 className="text-lg">
                    Average Rating: {bubblyWater.averageRating.toFixed(2)}{" "}
                    <span className="text-gray-500">({ratingsCount})</span>
                  </h3>
                  <Rating
                    value={previouslyRated ? userRating : value}
                    defaultValue={userRating}
                    precision={0.5}
                    onChange={(e, newValue) => {
                      handleValueChange(e, newValue);
                    }}
                  />
                </div>
              </div>
            </div>
            <ul className="border-2 border-black p-5">
              {bubblyWater.ratings.map((rating, index) => (
                <li key={index} className="border-solid">
                  <Link to={`/user/${rating.user._id}`}>
                    <span className="p-2 text-xl">{rating.user.username}</span>
                  </Link>
                  <span>
                    <Rating readOnly value={rating.rating} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section>Reviews</section>
        </>
      ) : (
        <h1 className="text-2xl">Loading...</h1>
      )}
    </>
  );
}
