import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { LOGIN_USER } from "../../utils/mutations";
import Auth from "../../utils/auth";

const Login = (props) => {
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [login, { error, data }] = useMutation(LOGIN_USER);

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

    try {
      const { data } = await login({
        variables: { ...formState },
      });

      Auth.login(data.login.token);
    } catch (e) {
      console.error(e);
    }

    // clear form values
    setFormState({
      email: "",
      password: "",
    });
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl text-center mb-6">Login</h1>

        {data ? (
          <p className="text-center mb-6">
            Success! You may now head{" "}
            <Link to="/me">back to the homepage.</Link>
          </p>
        ) : (
          <form onSubmit={handleFormSubmit} id="loginForm">
            <div className="mb-4">
              <input
                className="form-input w-full"
                placeholder="Your email"
                name="email"
                type="email"
                value={formState.email}
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
              <input
                className="form-input w-full"
                placeholder="******"
                name="password"
                type="password"
                value={formState.password}
                onChange={handleChange}
              />
            </div>

            <div className="text-center">
              <button
                className="btn btn-block btn-info"
                style={{ cursor: "pointer" }}
                type="submit"
              >
                Submit
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="my-3 p-3 bg-danger text-white text-center">
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
