import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { ADD_USER } from "../../utils/mutations";
import Auth from "../../utils/auth";

const Signup = () => {
  const [formState, setFormState] = useState({
    username: "",
    email: "",
    password: "",
    passwordCheck: "",
  });
  const [passwordErrorToggle, setPasswordErrorToggle] = useState(false);
  const [addProfile, { error, data }] = useMutation(ADD_USER);

  // update state based on form input changes
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

    const { username, email, password } = formState;
    if (formState.password == formState.passwordCheck) {
      try {
        const { data } = await addProfile({
          variables: { username, email, password },
        });
        Auth.login(data.addUser.token);
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
        <h1 className="text-3xl text-center mb-6 text-black">Sign Up</h1>

        {data ? (
          <p className="text-center mb-6">
            Success! You may now head <Link to="/">back to the homepage.</Link>
          </p>
        ) : (
          <form onSubmit={handleFormSubmit}>
            <div className="mb-4 border-2 border-solid px-1 border-sky-300">
              <input
                className="form-input w-full text-black"
                placeholder="Your username"
                name="username"
                type="text"
                value={formState.username}
                onChange={handleChange}
              />
            </div>

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
                placeholder="Password"
                name="password"
                type="password"
                value={formState.password}
                onChange={handleChange}
              />
            </div>

            <div className="mb-4 border-2 border-solid px-1 border-sky-300">
              <input
                className="form-input w-full text-black"
                placeholder="Confirm Password"
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
        )}

        {error && (
          <div className="my-3 p-3 bg-danger text-center dark:text-black">
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
