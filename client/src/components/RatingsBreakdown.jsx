export default function RatingsBreakdown({ ratings }) {
  const fiveRatings = ratings.filter((rating) => rating.rating === 5);
  const fourPointFiveRatings = ratings.filter(
    (rating) => rating.rating === 4.5
  );
  const fourRatings = ratings.filter((rating) => rating.rating === 4);
  const threePointFiveRatings = ratings.filter(
    (rating) => rating.rating === 3.5
  );
  const threeRatings = ratings.filter((rating) => rating.rating === 3);
  const twoPointFiveratings = ratings.filter((rating) => rating.rating === 2.5);
  const twoRatings = ratings.filter((rating) => rating.rating === 2);
  const onePointFiveRatings = ratings.filter((rating) => rating.rating === 1.5);
  const oneRatings = ratings.filter((rating) => rating.rating === 1);
  const pointFiveRatings = ratings.filter((rating) => rating.rating === 0.5);

  console.log("5 stars, ", fiveRatings);
  console.log("4.5 stars, ", fourPointFiveRatings);
  console.log("4 stars, ", fourRatings);
  console.log("3.5 stars, ", threePointFiveRatings);
  console.log("3 stars, ", threeRatings);
  console.log("2.5 stars, ", twoPointFiveratings);
  console.log("2 stars, ", twoRatings);
  console.log("1.5 stars, ", onePointFiveRatings);
  console.log("1 stars, ", oneRatings);
  console.log(".5 stars, ", pointFiveRatings);
  return (
    <div>
      <h2>5 Stars: {fiveRatings.length}</h2>
      <h2>4.5 Stars: {fourPointFiveRatings.length}</h2>
      <h2>4 Stars: {fourRatings.length}</h2>
      <h2>3.5 Stars: {threePointFiveRatings.length}</h2>
      <h2>3 Stars: {threeRatings.length}</h2>
      <h2>2.5 Stars: {twoPointFiveratings.length}</h2>
      <h2>2 Stars: {twoRatings.length}</h2>
      <h2>1.5 Stars: {onePointFiveRatings.length}</h2>
      <h2>1 Stars: {oneRatings.length}</h2>
      <h2>.5 Stars: {pointFiveRatings.length}</h2>
    </div>
  );
}
