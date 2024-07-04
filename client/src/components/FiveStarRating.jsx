import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Rating from "@mui/material/Rating";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Typography from "@mui/material/Typography";
import { materialUIStylings } from "../../utils/materialUIStylings";

const StyledRating = styled(Rating)({
  "& .MuiRating-iconFilled": {
    color: materialUIStylings("Lime"),
  },
  "& .MuiRating-iconHover": {
    color: materialUIStylings("Lime"),
  },
});

export default function CustomizedRating() {
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

  return (
    <div className="mt-40 ml-30">
      <Box
        sx={{
          "& > legend": { mt: 2 },
        }}
      >
        <Typography component="legend">Custom icon and color</Typography>
        <StyledRating
          name="customized-color"
          defaultValue={2}
          getLabelText={(value) => `${value} Heart${value !== 1 ? "s" : ""}`}
          precision={0.5}
          icon={<StarIcon fontSize="inherit" />}
          emptyIcon={<StarIcon fontSize="inherit" />}
        />
        <StyledRating
          name="customized-color"
          defaultValue={2}
          className="Lime"
          getLabelText={(value) => `${value} Heart${value !== 1 ? "s" : ""}`}
          precision={0.5}
          icon={<StarIcon fontSize="inherit" />}
          emptyIcon={<StarIcon fontSize="inherit" />}
        />
        <Typography component="legend">10 stars</Typography>
        <Rating name="customized-10" defaultValue={2} max={10} />
      </Box>
    </div>
  );
}
