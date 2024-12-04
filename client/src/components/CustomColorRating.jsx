import { styled } from "@mui/material/styles";
import { materialUIStylings } from "../../utils/materialUIStylings";
import StarIcon from "@mui/icons-material/Star";
import { useMutation, useQuery } from "@apollo/client";
import Auth from "../../utils/auth";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Rating from "@mui/material/Rating";
import { ADD_RATING, EDIT_RATING } from "../../utils/mutations";
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
  const [userRating, setUserRating] = useState(0);
  const [ratingId, setRatingId] = useState("");
  const [addRating] = useMutation(ADD_RATING);
  const [editRating] = useMutation(EDIT_RATING);
  const [value, setValue] = useState(0);
  const { data, refetch } = useQuery(QUERY_RATING_BY_USER, {
    variables: { userId: userId, bubblyWaterId: bubblyWaterId },
  });

  let emptyStar;
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    emptyStar = "gray";
  }

  useEffect(() => {
    refetch();
    if (data && data.findUsersRating) {
      setPreviouslyRated(true);
      setUserRating(data.findUsersRating.rating);
      setRatingId(data.findUsersRating._id);
    }
  }, [data]);

  const handleValueChange = (e, newValue) => {
    setIsSubmitting(true);
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
      await editRating({
        variables: {
          rating: newValue,
          ratingId: ratingId,
          bubblyWaterId: bubblyWaterId,
        },
      });
      console.log("new value: ", newValue);

      setUserRating(newValue);
      console.log("edited user value", userRating);
      setPreviouslyRated(true);
    } catch (err) {
      console.error("Error editing Rating, ", err);
    } finally {
      setIsSubmitting(false);
      setValue(0);
    }
  };

  const handleAddRating = async (e, newValue) => {
    e && e.preventDefault();
    try {
      const { data: addRatingData } = await addRating({
        variables: {
          rating: newValue,
          userId: userId,
          bubblyWaterId: bubblyWaterId,
        },
      });
      const { data: refetchedData } = await refetch();
      console.log("refetched data", refetchedData);
      setRatingId(refetchedData.findUsersRating._id);
      setUserRating(refetchedData.findUsersRating.rating);
      setPreviouslyRated(true);
      console.log("new value: ", newValue);
    } catch (err) {
      console.error("Error adding rating, ", err);
    } finally {
      setIsSubmitting(false);
      setValue(0);

      console.log(`bubbly water rating: ${userRating}`);
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
            emptyIcon={
              <StarIcon className="dark:text-gray-500" fontSize="inherit" />
            }
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
