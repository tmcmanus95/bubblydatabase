import { styled } from "@mui/material/styles";
import { materialUIStylings } from "../../utils/materialUIStylings";
import StarIcon from "@mui/icons-material/Star";
import { useMutation } from "@apollo/client";
import { useState } from "react";
import Rating from "@mui/material/Rating";
import {
  ADD_RATING,
  EDIT_RATING,
  ADD_REVIEW,
  EDIT_REVIEW,
} from "../../utils/mutations";

import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";

export default function CustomColorRating({
  flavor,
  rating,
  size,
  userId,
  bubblyWaterId,
  readability,
}) {
  console.log(
    `Custom Rating Component: User: ${userId} | Bubbly Water: ${bubblyWaterId}`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addRating, { error: addRatingError }] = useMutation(ADD_RATING);
  const [editRating, { error: editRatingError }] = useMutation(EDIT_RATING);
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
    <StyledRating
      name="customized-color"
      getLabelText={(value) => `${value} Heart${value !== 1 ? "s" : ""}`}
      value={rating}
      precision={0.5}
      size={size}
      icon={<StarIcon fontSize="inherit" />}
      readOnly
      emptyIcon={<StarIcon fontSize="inherit" />}
    />
  );
}
