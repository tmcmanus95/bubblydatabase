// Value math for the rating control (P1-21): half-star steps from 0.5 to 5.
export const MIN = 0.5;
export const MAX = 5;
export const STEP = 0.5;

const clamp = (v) => Math.min(MAX, Math.max(MIN, v));

// Where a pointer is across the stars (0 = left edge, 1 = right edge) -> rating, rounded up to the half star
// under the finger (touching the left half of the 4th star = 3.5)
export function valueFromFraction(fraction) {
  return clamp(Math.ceil(Math.max(0, Math.min(1, fraction)) * 10) / 2 || MIN);
}

// Keyboard: arrows move a half star, Home/End jump to the ends; returns null for other keys
export function valueFromKey(key, current) {
  const base = current || 0;
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return clamp(base + STEP);
    case "ArrowLeft":
    case "ArrowDown":
      return clamp(base - STEP);
    case "Home":
      return MIN;
    case "End":
      return MAX;
    default:
      return null;
  }
}

// A touch that moved further than this (CSS px) was a scroll or swipe, not a tap: it never rates
export const TAP_SLOP = 10;
export const movedTooFar = (start, end) => Math.hypot(end.x - start.x, end.y - start.y) > TAP_SLOP;

export const describe = (value) => (value ? `${value} out of 5 stars` : "Not rated");
