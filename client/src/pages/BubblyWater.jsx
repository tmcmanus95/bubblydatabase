import { QUERY_MEID, QUERY_SINGLE_BUBBLYWATER } from "../../utils/queries";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import Rating from "@mui/material/Rating";
import { useState, useEffect } from "react";
import Auth from "../../utils/auth";
import { ADD_RATING, EDIT_RATING } from "../../utils/mutations";

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
  let previouslyRated = false;
  let userRating = 0;
  let ratingId;
  let ratings = data?.bubblyWater?.ratings;

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

  return (
    <>
      {bubblyWater ? (
        <>
          <h1>{bubblyWater.brandName}</h1>
          <h2>{bubblyWater.productName}</h2>
          <h3>Flavors:</h3>
          <h4>{bubblyWater.flavor}</h4>
          <h3>Average Rating: {bubblyWater.averageRating.toFixed(2)}</h3>
          <Rating
            value={previouslyRated ? userRating : value}
            defaultValue={userRating}
            precision={0.5}
            onChange={(e, newValue) => {
              handleValueChange(e, newValue);
            }}
          />
        </>
      ) : (
        <h1>Loading...</h1>
      )}
    </>
  );
}
