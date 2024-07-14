import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import UsersRatings from "../components/UsersRatings";
import Loading from "../components/Loading";
import { QUERY_SPECIFIC_USER_RATINGS } from "../../utils/queries";
export default function SpecificUserRatings() {
  const params = useParams();
  const { userId, rating } = params;
  const isVerified = true;
  const [ratings, setRatings] = useState([]);
  const { loading, error, data } = useQuery(QUERY_SPECIFIC_USER_RATINGS, {
    variables: { userId: userId, rating: parseFloat(rating) },
  });
  useEffect(() => {
    setRatings(data?.queryUserRatingsOfGivenNumber.ratings);
  }, [data]);

  return (
    <>
      <div className="mt-20"></div>
      <div className="flex items-center justify-center">
        <div className="flex text-center justify-center">
          {rating} Star Ratings
        </div>
      </div>
      {data && ratings ? <UsersRatings ratings={ratings} /> : <Loading />}
    </>
  );
}
