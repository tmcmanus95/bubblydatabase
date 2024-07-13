import { useState } from "react";
import { useMutation } from "@apollo/client";
import { SEND_PASSWORD_RESET_LINK } from "../../utils/mutations";
import { Link } from "react-router-dom";
export default function ForgotPassword() {
  const [formState, setFormState] = useState({
    email: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormState({
      ...formState,
      [name]: value,
    });
  };
  const [sendPasswordResetLink, { data, loading, error }] = useMutation(
    SEND_PASSWORD_RESET_LINK
  );
  // submit form
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const { email } = formState;
    try {
      const { data } = sendPasswordResetLink({
        variables: { email: email },
      });
    } catch (error) {
      console.log("Could not send password reset link", error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      {data ? (
        <div className="flex flex-col items-center mb-50 md:text-3xl dark:border-white border-blue-300 border-2 md:mx-60 mx-10 p-3">
          <h1>Password reset link sent</h1>
          <h2 className="text-center">
            Check your email and follow the instructions to reset password
          </h2>
        </div>
      ) : (
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-3xl text-center mb-6 text-black">
            Send Password Reset Link
          </h1>
          <form onSubmit={handleFormSubmit}>
            <div className="mb-4 border-2 border-solid px-1 border-sky-300">
              <input
                className="form-input w-full text-black"
                placeholder="Your email"
                name="email"
                type="email"
                value={formState.email}
                onChange={handleChange}
              />
            </div>
            {error && (
              <div className="my-3 p-3 bg-danger text-center">
                {error.message}
              </div>
            )}

            <div className="text-center">
              <button
                className="bg-transparent hover:bg-blue-300 text-blue-500 font-semibold hover:text-white py-2 px-4 border border-blue-300 hover:border-transparent rounded"
                style={{ cursor: "pointer" }}
                type="submit"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
