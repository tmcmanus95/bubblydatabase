import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_USER, QUERY_ME } from "../../utils/queries";
import { useParams } from "react-router-dom";
import UsersRatings from "../components/UsersRatings";
import UsersReviews from "../components/UsersReviews";
import Loading from "../components/Loading";
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
        <Loading />
      ) : (
        <>
          <div className="flex justify-center items-center mt-10 h-full">
            <div className="flex justify-center items-center mx-5 bg-red-300 w-16 h-16 lg:w-32 lg:h-32 rounded-full">
              <span className="text-xl font-bold">
                {username[0].toUpperCase()}
              </span>
            </div>
            <h1 className="mt-2">{username}</h1>
          </div>
          {/* <div className="flex justify-center items-center mt-10 gap-10 h-full">
            <h5>Total Ratings: {ratings?.length}</h5>
            <h5>Total Reviews: {reviews?.length}</h5>
          </div> */}

          <div className="flex flex-wrap justify-center">
            {ratings && <UsersRatings ratings={ratings} />}
            {reviews && <UsersReviews reviews={reviews} />}
          </div>
        </>
      )}
    </>
  );
}
