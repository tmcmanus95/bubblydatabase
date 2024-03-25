import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_USER, QUERY_ME } from "../../utils/queries";
import { useParams } from "react-router-dom";
import UsersRatings from "../components/UsersRatings";
import UsersReviews from "../components/UsersReviews";
export default function Profile() {
  const { userId } = useParams();
  const { loading, data } = useQuery(userId ? QUERY_SINGLE_USER : QUERY_ME, {
    variables: { userId: userId },
  });
  console.log("user data ", data);
  let username;
  let ratings;
  let reviews;
  if (userId) {
    ratings = data?.user?.ratings;
    reviews = data?.user?.reviews;
    username = data?.user?.username;
  } else {
    ratings = data?.me?.ratings;
    reviews = data?.me?.reviews;
    username = data?.me?.username;
  }
  console.log(ratings);
  return (
    <>
      <h1>{username}</h1>
      <div className="flex flex-wrap justify-center">
        {ratings && <UsersRatings ratings={ratings} />}
        {reviews && <UsersReviews reviews={reviews} />}
      </div>
    </>
  );
}
