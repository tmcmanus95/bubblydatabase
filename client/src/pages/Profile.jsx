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
      {loading ? (
        <h1>Loading...</h1>
      ) : (
        <>
          <div className="justify-center align-center text-center">
            <div className="flex justify-center items-center bg-red-300 w-32 h-32 rounded-full">
              <span className="text-xl font-bold">
                {username[0].toUpperCase()}
              </span>
            </div>
            <h1 className="mt-2">{username}</h1>
          </div>
          <div className="flex flex-wrap justify-center">
            {ratings && <UsersRatings ratings={ratings} />}
            {reviews && <UsersReviews reviews={reviews} />}
          </div>
        </>
      )}
    </>
  );
}
