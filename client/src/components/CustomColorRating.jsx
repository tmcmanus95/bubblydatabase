import { styled } from "@mui/material/styles";
import { materialUIStylings } from "../../utils/materialUIStylings";
import StarIcon from "@mui/icons-material/Star";
import Rating from "@mui/material/Rating";

import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";

export default function CustomColorRating({
  flavor,
  rating,
  size,
  readability,
}) {
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
