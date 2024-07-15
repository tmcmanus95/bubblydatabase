import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import UsersReviews from "../components/UsersReviews";
import { QUERY_USERS_REVIEWS_BY_RANGE } from "../../utils/queries";
export default function AllReviews() {
  const { userId, numRange, totalReviewsNumber } = useParams();
  const [reviews, setReviews] = useState([]);
  const [linkChunks, setLinkChunks] = useState([]);
  let isVerified = true;
  const { data, loading, error } = useQuery(QUERY_USERS_REVIEWS_BY_RANGE, {
    variables: { userId: userId, numRange: numRange },
  });
  useEffect(() => {
    setReviews(data?.usersReviews?.reviews);
    const remainder = totalReviewsNumber % 10;
    const groupsOfTwentyFive = Math.floor(totalReviewsNumber / 10);
    let newLinkChunks = [];

    for (let i = 1; i <= groupsOfTwentyFive; i++) {
      let lower = i * 10 - 9;
      let upper = i * 10;
      let chunk = `${lower}-${upper}`;
      newLinkChunks.push(chunk);
      if (remainder != 0 && upper + 10 > totalReviewsNumber) {
        lower = (i + 1) * 10 - 9;
        upper = lower + remainder - 1;
        let chunk = `${lower}-${upper}`;
        newLinkChunks.push(chunk);
      }
    }
    setLinkChunks(newLinkChunks);
  }, [data, totalReviewsNumber]);
  return (
    <div className="mt-20 flex flex-col justify-center">
      <h1 className="flex justify-center">All Reviews</h1>

      <div className="flex flex-row justify-center">
        {linkChunks?.map((link, index) => (
          <div key={index} className="flex justify-center p-2 text-blue-500">
            <Link
              to={`/user/${userId}/allReviews/${link}/${totalReviewsNumber}`}
            >
              {link}
            </Link>
          </div>
        ))}
      </div>
      <UsersReviews reviews={reviews} userId={userId} isVerified={isVerified} />
    </div>
  );
}
