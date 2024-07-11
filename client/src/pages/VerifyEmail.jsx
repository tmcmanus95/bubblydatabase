import { useMutation, useQuery } from "@apollo/client";
import { VERIFY_EMAIL } from "../../utils/mutations";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Auth from "../../utils/auth";
import { QUERY_MEID } from "../../utils/queries";

export default function VerifyEmail() {
  const { token } = useParams();
  const [verifyEmail, { data, loading, error }] = useMutation(VERIFY_EMAIL);
  const { data: meIdData, error: meIdError } = useQuery(QUERY_MEID);
  const [meId, setMeId] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (meIdData) {
      setMeId(meIdData.meId._id);
      console.log("_id", meId);
    }
    const verify = async () => {
      if (Auth.loggedIn()) {
        console.log("person is logged in");
        try {
          const { data } = await verifyEmail({ variables: { token } });
          if (data) {
            console.log("verify email data", data);
          }
          if (data.verifyEmail.user.isVerified) {
            setIsVerified(true);
          }
        } catch (err) {
          console.error("Error verifying email:", err);
        }
      } else {
        console.log("person is not logged in");
      }
    };

    verify();
  }, [token, verifyEmail]);

  return Auth.loggedIn() ? (
    <div className="my-20">
      {loading && <p>Verifying email...</p>}
      {isVerified ? (
        <div className="flex flex-col items-center mt-40 mb-50 md:text-3xl dark:border-white border-blue-300 border-2 md:mx-60 mx-10 p-3">
          <h1>Success!</h1>
          <h2>You may now rate bubbly waters!</h2>
          <Link
            className="mt-10 hover:bg-blue-100 dark:hover:bg-gray-700 p-2 rounded-lg"
            to={"/"}
          >
            Home
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center mt-40 mb-50 md:text-3xl dark:border-white border-blue-300 border-2 md:mx-60 mx-10 p-3">
          <h1>Could not authenticate email.</h1>
          <Link
            className="mt-10 hover:bg-blue-100 dark:hover:bg-gray-700 p-2 rounded-lg"
            to={"/"}
          >
            Home
          </Link>
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center mt-40 mb-50 md:text-3xl dark:border-white border-blue-300 border-2 md:mx-60 mx-10 p-3">
      <h1>
        Please <Link to={"/login"}>Login</Link> to verify email
      </h1>
    </div>
  );
}
