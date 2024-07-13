import { useState } from "react";
export default function ResetPassword() {
  const [formState, setFormState] = useState({
    email: "",
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

    const { email } = formState;
  };

  return (
    <div className="flex justify-center items-center h-screen">
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
