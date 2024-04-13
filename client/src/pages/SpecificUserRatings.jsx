import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { QUERY_SPECIFIC_USER_RATINGS } from "../../utils/queries";
export default function SpecificUserRatings() {
  const params = useParams();
  const { userId, rating } = params;
  console.log(typeof rating);
  console.log("userid, " + userId + " rating, " + rating);

  const { loading, error, data } = useQuery(QUERY_SPECIFIC_USER_RATINGS, {
    variables: { userId: userId, rating: parseInt(rating) },
  });

  console.log(data);
  if (loading) return <p className="mt-20">Loading...</p>;
  if (error) return <p className="mt-20">Error fetching data</p>;

  return <p className="mt-20">data found</p>;
}
