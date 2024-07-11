import { styled } from "@mui/material/styles";
import { materialUIStylings } from "../../utils/materialUIStylings";
import StarIcon from "@mui/icons-material/Star";
import { useMutation, useQuery } from "@apollo/client";
import Auth from "../../utils/auth";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
  isVerified,
}) {
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previouslyRated, setPreviouslyRated] = useState(false);
  const [userRating, setUserRating] = useState(rating);
  const [ratingId, setRatingId] = useState("");
  const [addRating] = useMutation(ADD_RATING);
  const [editRating] = useMutation(EDIT_RATING);
  const [value, setValue] = useState(0);
  const { data } = useQuery(QUERY_RATING_BY_USER, {
    variables: { userId: userId, bubblyWaterId: bubblyWaterId },
  });

  let emptyStar;
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    emptyStar = "gray";
  }

  if (!isVerified) {
    console.log("nope");
  }

  useEffect(() => {
    if (data) {
      setPreviouslyRated(true);
      setUserRating(data.findUsersRating.rating);
      setRatingId(data.findUsersRating._id);
    }
  }, [data]);

  const handleValueChange = (e, newValue) => {
    setValue(newValue);
    setIsSubmitting(true);
    if (previouslyRated) {
      handleEditRating(e, newValue);
    } else {
      handleAddRating(e, newValue);
    }
  };

  const handleEditRating = async (e, newValue) => {
    e.preventDefault();
    try {
      await editRating({
        variables: {
          rating: newValue,
          ratingId: ratingId,
          bubblyWaterId: bubblyWaterId,
        },
      });
      setPreviouslyRated(true);
    } catch (err) {
      console.error("Error editing Rating, ", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRating = async (e, newValue) => {
    e && e.preventDefault();
    try {
      await addRating({
        variables: {
          rating: newValue,
          userId: userId,
          bubblyWaterId: bubblyWaterId,
        },
      });
      setPreviouslyRated(true);
      setUserRating(newValue);
    } catch (err) {
      console.error("Error adding rating, ", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const capitalFlavor = capitalizeSingleFlavor(flavor);
  const StyledRating = styled(Rating)(({ theme }) => ({
    "& .MuiRating-iconFilled": {
      color: materialUIStylings(capitalFlavor),
    },
    "& .MuiRating-iconHover": {
      color: materialUIStylings(capitalFlavor),
    },
  }));

  return (
    <div className="flex flex-col items-center">
      {Auth.loggedIn() && !isVerified ? (
        <div>Please verify email to rate</div>
      ) : (
        <></>
      )}
      {Auth.loggedIn() &&
      location.pathname !== `/user/${userId}` &&
      location.pathname !== "/me" &&
      isVerified ? (
        <div className="flex items-center">
          <StyledRating
            name="customized-color"
            getLabelText={(value) => `${value} Heart${value !== 1 ? "s" : ""}`}
            precision={0.5}
            value={previouslyRated ? userRating : value}
            size={size}
            disabled={isSubmitting}
            onChange={(e, newValue) => {
              setIsSubmitting(true);
              console.log(
                "Rating changed:",
                newValue,
                "Submitting:",
                isSubmitting
              );
              handleValueChange(e, newValue);
            }}
            icon={<StarIcon fontSize="inherit" />}
            emptyIcon={<StarIcon fontSize="inherit" />}
            className="flex justify-center"
          />
        </div>
      ) : (
        <div>
          <Link to={`/bubblyWater/${bubblyWaterId}`}>
            <div className="flex items-center">
              <StyledRating
                name="customized-color"
                getLabelText={(value) =>
                  `${value} Heart${value !== 1 ? "s" : ""}`
                }
                precision={0.5}
                value={rating}
                size={size}
                readOnly
                icon={<StarIcon fontSize="inherit" />}
                emptyIcon={
                  <StarIcon fontSize="inherit" style={{ color: emptyStar }} />
                }
                className="flex justify-center"
              />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
