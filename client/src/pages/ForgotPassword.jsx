import { useState } from "react";
import Auth from "../../utils/auth";

export default function ForgotPassword() {
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    passwordCheck: "",
  });

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

    const { email, password } = formState;
    if (formState.password == formState.passwordCheck) {
      try {
        const { data } = await addProfile({
          variables: { username, email, password },
        });
        Auth.login(data.addUser.token); // Assuming addUser returns the token
      } catch (e) {
        console.error(e);
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
              name="passwordCheck"
              type="password"
              value={formState.passwordCheck}
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
