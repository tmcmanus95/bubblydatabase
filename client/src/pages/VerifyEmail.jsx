import { useMutation } from "@apollo/client";
import { VERIFY_EMAIL } from "../../utils/mutations";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function VerifyEmail() {
  const { token } = useParams();
  const [verifyEmail, { data, loading, error }] = useMutation(VERIFY_EMAIL);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verify = async () => {
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
    };
    verify();
  }, [token, verifyEmail]);

  return (
    <div className="my-20 ">
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
  );
}
