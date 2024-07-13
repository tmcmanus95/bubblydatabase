import { useState } from "react";
import Auth from "../../utils/auth";
import { useMutation } from "@apollo/client";
import { useParams } from "react-router-dom";
import { RESET_PASSWORD } from "../../utils/mutations";

export default function ResetPassword() {
  const { token } = useParams();
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    passwordCheck: "",
  });
  const [passwordErrorToggle, setPasswordErrorToggle] = useState(false);

  const [resetPassword, { data, loading, error }] = useMutation(RESET_PASSWORD);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormState({
      ...formState,
      [name]: value,
    });
  };

  // submit form
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (formState.password == formState.passwordCheck) {
      const { email, password } = formState;
      try {
        const { data } = await resetPassword({
          variables: { token: token, email: email, newPassword: password },
        });
        console.log("data", data);
      } catch (err) {
        console.log("Could not reset password.");
      }
    } else {
      setPasswordErrorToggle(true);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl text-center mb-6 text-black">Reset Password</h1>
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

          <div className="mb-4 border-2 border-solid px-1 border-sky-300">
            <input
              className="form-input w-full text-black"
              placeholder="New Password"
              name="password"
              type="password"
              value={formState.password}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4 border-2 border-solid px-1 border-sky-300">
            <input
              className="form-input w-full text-black"
              placeholder="Confirm New Password"
              name="passwordCheck"
              type="password"
              value={formState.passwordCheck}
              onChange={handleChange}
            />
          </div>
          {passwordErrorToggle ? (
            <div>
              <h1 className="text-black">Passwords do not match</h1>
            </div>
          ) : (
            <></>
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
    </div>
  );
}
