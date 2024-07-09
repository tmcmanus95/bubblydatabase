import { useMutation } from "@apollo/client";
import { VERIFY_EMAIL } from "../../utils/mutations";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

export default function VerifyEmail() {
  const { token } = useParams();
  const [verifyEmail, { data, loading, error }] = useMutation(VERIFY_EMAIL);

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await verifyEmail({ variables: { token } });
        if (data.verifyEmail.user.isVerified) {
          alert("Email verified successfully! You can now log in.");
        }
      } catch (err) {
        console.error("Error verifying email:", err);
      }
    };
    verify();
  }, [token, verifyEmail]);

  return (
    <div className="mt-20">
      {loading && <p>Verifying email...</p>}
      {error && <p>Error verifying email: {error.message}</p>}
    </div>
  );
}
