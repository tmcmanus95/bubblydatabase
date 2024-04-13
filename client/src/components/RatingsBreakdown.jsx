import { Rating } from "@mui/material";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
export default function RatingsBreakdown({ ratings }) {
  const userId = useParams();
  console.log(userId.userId);
  const fiveRatings = ratings.filter((rating) => rating.rating === 5);
  const fourPointFiveRatings = ratings.filter(
    (rating) => rating.rating === 4.5
  );
  const fourRatings = ratings.filter((rating) => rating.rating === 4);
  const threePointFiveRatings = ratings.filter(
    (rating) => rating.rating === 3.5
  );
  const threeRatings = ratings.filter((rating) => rating.rating === 3);
  const twoPointFiveRatings = ratings.filter((rating) => rating.rating === 2.5);
  const twoRatings = ratings.filter((rating) => rating.rating === 2);
  const onePointFiveRatings = ratings.filter((rating) => rating.rating === 1.5);
  const oneRatings = ratings.filter((rating) => rating.rating === 1);
  const pointFiveRatings = ratings.filter((rating) => rating.rating === 0.5);
  const fivePercent = ((fiveRatings.length / ratings.length) * 100).toFixed(1);
  const fourPointFivePercent = (
    (fourPointFiveRatings.length / ratings.length) *
    100
  ).toFixed(1);
  const fourPercent = ((fourRatings.length / ratings.length) * 100).toFixed(1);
  const threePointFivePercent = (
    (threePointFiveRatings.length / ratings.length) *
    100
  ).toFixed(1);
  const threePercent = ((threeRatings.length / ratings.length) * 100).toFixed(
    1
  );
  const twoPointFivePercent = (
    (twoPointFiveRatings.length / ratings.length) *
    100
  ).toFixed(1);
  const twoPercent = ((twoRatings.length / ratings.length) * 100).toFixed(1);
  const onePointFivePercent = (
    (onePointFiveRatings.length / ratings.length) *
    100
  ).toFixed(1);
  const onePercent = ((oneRatings.length / ratings.length) * 100).toFixed(1);
  const pointFivePercent = (
    (pointFiveRatings.length / ratings.length) *
    100
  ).toFixed(1);

  return (
    <div className="flex-col flex items-center ">
      <h3 className="mb-2">Ratings Breakdown</h3>
      <Link to={`/user/${userId.userId}/ratings/5`}>
        <h2 className="flex w-64 md:w-96 border-2 border-black   justify-between lg:text-md text-xs">
          <span className="align-left">5 Stars: {fiveRatings.length}</span>
          <span>{fivePercent} %</span>
          <Rating readOnly size="small" value={5} />
        </h2>
      </Link>
      <h2 className="flex w-64 md:w-96 border-2 border-black  justify-between lg:text-md text-xs">
        <span>4.5 Stars: {fourPointFiveRatings.length}</span>
        <span>{fourPointFivePercent} %</span>
        <Rating readOnly size="small" value={4.5} precision={0.5} />
      </h2>
      <h2 className="flex w-64 md:w-96 border-2 border-black  justify-between lg:text-md text-xs">
        <span>4 Stars: {fourRatings.length}</span>
        <span>{fourPercent} %</span>
        <Rating readOnly size="small" value={4} precision={0.5} />
      </h2>
      <h2 className="flex w-64 md:w-96 border-2 border-black  justify-between lg:text-md text-xs">
        <span>3.5 Stars: {threePointFiveRatings.length}</span>
        <span>{threePointFivePercent} %</span>
        <Rating readOnly size="small" value={3.5} precision={0.5} />
      </h2>
      <h2 className="flex w-64 md:w-96 border-2 border-black  justify-between lg:text-md text-xs">
        <span>3 Stars: {threeRatings.length}</span>
        <span>{threePercent} %</span>
        <Rating readOnly size="small" value={3} precision={0.5} />
      </h2>
      <h2 className="flex w-64 md:w-96 border-2 border-black  justify-between lg:text-md text-xs">
        <span>2.5 Stars: {twoPointFiveRatings.length}</span>
        <span>{twoPointFivePercent} %</span>
        <Rating readOnly size="small" value={2.5} precision={0.5} />
      </h2>
      <h2 className="flex w-64 md:w-96 border-2 border-black  justify-between lg:text-md text-xs">
        <span>2 Stars: {twoRatings.length}</span>
        <span>{twoPercent} %</span>
        <Rating readOnly size="small" value={2} precision={0.5} />
      </h2>
      <h2 className="flex w-64 md:w-96 border-2 border-black  justify-between lg:text-md text-xs">
        <span>1.5 Stars: {onePointFiveRatings.length}</span>
        <span>{onePointFivePercent} %</span>
        <Rating readOnly size="small" value={1.5} precision={0.5} />
      </h2>
      <h2 className="flex w-64 md:w-96 border-2 border-black  justify-between lg:text-md text-xs">
        <span>1 Stars: {oneRatings.length}</span>
        <span>{onePercent} %</span>
        <Rating readOnly size="small" value={1} precision={0.5} />
      </h2>
      <h2 className="flex w-64 md:w-96 border-2 border-black  justify-between lg:text-md text-xs">
        <span>.5 Stars: {pointFiveRatings.length}</span>
        <span>{pointFivePercent} %</span>
        <Rating readOnly size="small" value={0.5} precision={0.5} />
      </h2>
    </div>
  );
}
