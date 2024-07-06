import React from "react";
import { useForm, ValidationError } from "@formspree/react";
export default function Contact() {
  const [state, handleSubmit] = useForm("mqkrpbrd");
  if (state.succeeded) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-6  rounded-md shadow-md">
        <p className="text-center text-2xl">
          Thank you for your message. I will get back to you soon.
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto my-8 p-6  rounded-md shadow-md mt-20">
      <h2 className="text-3xl text-center mb-6 font-bold">Contact Me</h2>
      <h1 className="my-3">
        If submitting a missing brand or product, please include a source in
        your message.{" "}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="mb-4">
          <label htmlFor="email" className="text-gray-600 dark:text-gray-200">
            Name
          </label>
          <input
            id="name"
            type="name"
            name="name"
            className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <label htmlFor="email" className="text-gray-600 dark:text-gray-200">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
        />
        <label htmlFor="email" className="text-gray-600 dark:text-gray-200">
          Message
        </label>
        <textarea
          id="message"
          type="message"
          name="message"
          className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
        />
        <ValidationError prefix="Email" field="email" errors={state.errors} />
        <ValidationError
          prefix="Message"
          field="message"
          errors={state.errors}
        />
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={state.submitting}
            className="mt-3 bg-blue-100  px-4 py-2 rounded-md  focus:outline-none hover:bg-blue-300"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
