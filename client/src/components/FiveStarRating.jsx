import * as React from "react";
import Box from "@mui/material/Box";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";

export default function BasicRating() {
  const [value, setValue] = React.useState(0);
  return (
    <Box
      sx={{
        "& > legend": { mt: 2 },
      }}
    >
      <Rating
        name="half-rating"
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          console.log(value);
        }}
        precision={0.5}
      />
    </Box>
  );
}
