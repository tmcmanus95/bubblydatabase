import { test } from "node:test";
import assert from "node:assert";
import { valueFromFraction, valueFromKey, movedTooFar, describe } from "./ratingInput.js";

test("pointer position maps to half stars, rounding up to the half under the finger", () => {
  assert.strictEqual(valueFromFraction(0), 0.5);
  assert.strictEqual(valueFromFraction(0.05), 0.5);
  assert.strictEqual(valueFromFraction(0.62), 3.5); // left half of the 4th star
  assert.strictEqual(valueFromFraction(0.75), 4);
  assert.strictEqual(valueFromFraction(1), 5);
  assert.strictEqual(valueFromFraction(1.4), 5);
  assert.strictEqual(valueFromFraction(-1), 0.5);
});

test("keys step by halves within 0.5 to 5", () => {
  assert.strictEqual(valueFromKey("ArrowRight", 3), 3.5);
  assert.strictEqual(valueFromKey("ArrowUp", 5), 5);
  assert.strictEqual(valueFromKey("ArrowLeft", 0.5), 0.5);
  assert.strictEqual(valueFromKey("ArrowRight", undefined), 0.5);
  assert.strictEqual(valueFromKey("Home", 4), 0.5);
  assert.strictEqual(valueFromKey("End", 1), 5);
  assert.strictEqual(valueFromKey("a", 3), null);
});

test("taps vs scrolls, and screen-reader text", () => {
  assert.strictEqual(movedTooFar({ x: 0, y: 0 }, { x: 3, y: 4 }), false);
  assert.strictEqual(movedTooFar({ x: 0, y: 0 }, { x: 0, y: 14 }), true);
  assert.strictEqual(describe(4.5), "4.5 out of 5 stars");
  assert.strictEqual(describe(undefined), "Not rated");
});
