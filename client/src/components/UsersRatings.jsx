import Rating from "@mui/material/Rating";
export default function UsersRatings({ ratings }) {
  return (
    <>
      <h3>Users Ratings</h3>
      {ratings?.map((rating, index) => (
        <h3 key={index}>
          {" "}
          {rating.bubblyWater.flavor} {rating.bubblyWater.brandName} |{" "}
          {rating.rating} stars <Rating readOnly value={rating.rating} />
        </h3>
      ))}
    </>
  );
}
