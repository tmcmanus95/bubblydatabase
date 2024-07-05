import { styled } from "@mui/material/styles";
import { materialUIStylings } from "../../utils/materialUIStylings";
import StarIcon from "@mui/icons-material/Star";
import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import Rating from "@mui/material/Rating";
import {
  ADD_RATING,
  EDIT_RATING,
  ADD_REVIEW,
  EDIT_REVIEW,
} from "../../utils/mutations";
import { QUERY_RATING_BY_USER } from "../../utils/queries";

import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";

export default function CustomColorRating({
  flavor,
  rating,
  size,
  userId,
  bubblyWaterId,
  readability,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addRating, { error: addRatingError }] = useMutation(ADD_RATING);
  const [editRating, { error: editRatingError }] = useMutation(EDIT_RATING);
  const { data, error } = useQuery(QUERY_RATING_BY_USER, {
    variables: { userId: userId, bubblyWaterId: bubblyWaterId },
  });
  let previouslyRated = false;
  let userRating;
  if (data) {
    console.log("data from rating component", data);
    previouslyRated = true;
    rating = data.findUsersRating.rating;
    console.log("new rating, ", rating);
  }
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
      previouslyRated = true;
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
      previouslyRated = true;
    } catch (err) {
      console.error("Error adding rating, ", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratedWater = previouslyRated
    ? { border: "2px solid green", borderRadius: "25px" }
    : {};

  const capitalFlavor = capitalizeSingleFlavor(flavor);
  const StyledRating = styled(Rating)({
    "& .MuiRating-iconFilled": {
      color: materialUIStylings(capitalFlavor),
    },
    "& .MuiRating-iconHover": {
      color: materialUIStylings(capitalFlavor),
    },
  });
  return (
    <>
      <StyledRating
        name="customized-color"
        getLabelText={(value) => `${value} Heart${value !== 1 ? "s" : ""}`}
        value={rating}
        precision={0.5}
        size={size}
        icon={<StarIcon fontSize="inherit" />}
        readOnly={isSubmitting ? true : false}
        style={ratedWater}
        emptyIcon={<StarIcon fontSize="inherit" />}
      />
    </>
  );
}
