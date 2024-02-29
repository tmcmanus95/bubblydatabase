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
  });
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

    try {
      const { data } = await addProfile({
        variables: { ...formState },
      });

      Auth.login(data.addUser.token); // Assuming addUser returns the token
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="signUpFormContainer">
        <div>
          <h1>Sign Up</h1>

          {data ? (
            <p>
              Success! You may now head{" "}
              <Link to="/">back to the homepage.</Link>
            </p>
          ) : (
            <form onSubmit={handleFormSubmit}>
              <div>
                <div>
                  <input
                    className="form-input"
                    placeholder="Your username"
                    name="username"
                    type="text"
                    value={formState.username}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <div>
                  <input
                    className="form-input"
                    placeholder="Your email"
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <div>
                  <input
                    className="form-input"
                    placeholder="******"
                    name="password"
                    type="password"
                    value={formState.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <div>
                  <button
                    className="btn btn-block btn-info"
                    style={{ cursor: "pointer" }}
                    type="submit"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>
          )}

          {error && (
            <div className="my-3 p-3 bg-danger text-white">{error.message}</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Signup;
