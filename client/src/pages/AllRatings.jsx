import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import UsersRatings from "../components/UsersRatings";
import { QUERY_USERS_RATINGS_BY_RANGE } from "../../utils/queries";
export default function AllRatings() {
  const { userId, numRange, totalRatingsNumber } = useParams();
  const [ratings, setRatings] = useState([]);
  const [linkChunks, setLinkChunks] = useState([]);
  let isVerified = true;
  const { data, loading, error } = useQuery(QUERY_USERS_RATINGS_BY_RANGE, {
    variables: { userId: userId, numRange: numRange },
  });
  useEffect(() => {
    setRatings(data?.usersRatings?.ratings);
    const remainder = totalRatingsNumber % 25;
    const groupsOfTwentyFive = Math.floor(totalRatingsNumber / 25);
    let newLinkChunks = [];

    for (let i = 1; i <= groupsOfTwentyFive; i++) {
      let lower = i * 25 - 24;
      let upper = i * 25;
      let chunk = `${lower}-${upper}`;
      newLinkChunks.push(chunk);
      if (remainder != 0 && upper + 25 > totalRatingsNumber) {
        lower = (i + 1) * 25 - 24;
        upper = lower + remainder - 1;
        let chunk = `${lower}-${upper}`;
        newLinkChunks.push(chunk);
      }
    }
    setLinkChunks(newLinkChunks);
  }, [data, totalRatingsNumber]);
  return (
    <div className="mt-20 flex flex-col justify-center">
      <h1 className="flex justify-center">All Ratings</h1>

      <div className="flex flex-row justify-center">
        {linkChunks?.map((link, index) => (
          <div key={index} className="flex justify-center p-2 text-blue-500">
            <Link
              to={`/user/${userId}/allRatings/${link}/${totalRatingsNumber}`}
            >
              {link}
            </Link>
          </div>
        ))}
      </div>
      <UsersRatings ratings={ratings} userId={userId} isVerified={isVerified} />
    </div>
  );
}
