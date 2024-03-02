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
  const ratings = data?.me?.ratings;
  console.log(ratings);
  return (
    <>
      <h1>{data?.me?.username}</h1>
      <UsersRatings ratings={ratings} />
    </>
  );
}
