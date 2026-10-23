import { test } from "node:test";
import assert from "node:assert";
import { errorMessage } from "./errorMessage.js";

test("errorMessage prefers the server's message, then a friendly 429, then Apollo's", () => {
  const limited = { message: "Response not successful: Received status code 429", networkError: { statusCode: 429, result: { errors: [{ message: "Too many requests. Please wait a bit and try again." }] } } };
  assert.strictEqual(errorMessage(limited), "Too many requests. Please wait a bit and try again.");
  assert.strictEqual(errorMessage({ message: "x", networkError: { statusCode: 429 } }), "Too many requests. Please wait a bit and try again.");
  assert.strictEqual(errorMessage({ message: "Too many login attempts. Try again in 4 seconds." }), "Too many login attempts. Try again in 4 seconds.");
  assert.strictEqual(errorMessage(undefined), "");
});
