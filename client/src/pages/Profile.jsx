import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_USER, QUERY_ME } from "../../utils/queries";
import { useParams } from "react-router-dom";
import UsersRatings from "../components/UsersRatings";
export default function Profile() {
  const { userId } = useParams();
  const { loading, data } = useQuery(userId ? QUERY_SINGLE_USER : QUERY_ME, {
    variables: { userId: userId },
  });
  console.log("user data ", data);
  let username;
  let ratings;
  if (userId) {
    ratings = data?.user?.ratings;
    username = data?.user?.username;
  } else {
    ratings = data?.me?.ratings;
    username = data?.me?.username;
  }
  console.log(ratings);
  return (
    <>
      <h1 className="text-3xl justify-center flex m-10">{username}</h1>
      {ratings ? <UsersRatings ratings={ratings} /> : <></>}
    </>
  );
}
