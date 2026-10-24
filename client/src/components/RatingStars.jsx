import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import Stars from "./Stars";
import { showToast } from "./Toast";
import { RATE_PRODUCT, REMOVE_RATING } from "../../utils/mutations";
import { getMine, setMine, refreshMine, useMyRating } from "../../utils/myRatings";
import { describe, movedTooFar, valueFromFraction, valueFromKey } from "../../utils/ratingInput";
import { errorMessage } from "../../utils/errorMessage";

// The interactive star rating (P1-21). Tap or click a star to rate (half stars: the left half of a star is
// a half). Mouse hover and finger drags preview; the rating is saved when you let go. A touch that turns
// into a scroll never rates. Keyboard: arrows, Home, End (saved after a short pause). Saves optimistically,
// rolls back with a message if saving fails, and offers "Undo" in a toast.
//
// Before you've rated, the stars show `average` (the community score); after, your own rating, marked
// "You". Sits above the card's stretched link, so tapping it never opens the product.
const KEY_SAVE_DELAY_MS = 700;

export default function RatingStars({ productId, productName, average, starStyle, size = "card" }) {
  const mine = useMyRating(productId);
  const [preview, setPreview] = useState(null);
  const [rate] = useMutation(RATE_PRODUCT);
  const [unrate] = useMutation(REMOVE_RATING);
  const box = useRef(null);
  const press = useRef(null); // { id, start: {x, y}, cancelled }
  const keyTimer = useRef(null);
  useEffect(() => () => clearTimeout(keyTimer.current), []);

  const myValue = mine ? mine.rating : undefined;
  const shown = preview ?? myValue ?? average ?? 0;

  const save = async (value) => {
    const before = getMine(productId);
    if (before && before.rating === value) return;
    setMine(productId, { rating: value, ratingId: before ? before.ratingId : null }); // optimistic
    try {
      await rate({ variables: { bubblyWaterId: productId, rating: value } });
      refreshMine(productId); // picks up the rating's id (for Undo) and anything changed elsewhere
      showToast({
        message: `Rated ${productName ? `${productName} ` : ""}${value} ★`,
        actionLabel: "Undo",
        onAction: () => undo(before),
      });
    } catch (error) {
      setMine(productId, before ?? null); // roll back
      showToast({ message: errorMessage(error) || "Couldn't save your rating. Please try again." });
    }
  };

  const undo = async (before) => {
    const now = getMine(productId);
    try {
      if (before) {
        setMine(productId, before);
        await rate({ variables: { bubblyWaterId: productId, rating: before.rating } });
      } else if (now && now.ratingId) {
        setMine(productId, null);
        await unrate({ variables: { ratingId: now.ratingId }, refetchQueries: "active" });
      }
      refreshMine(productId);
    } catch (error) {
      refreshMine(productId);
      showToast({ message: errorMessage(error) || "Couldn't undo. Please try again." });
    }
  };

  const valueAt = (clientX) => {
    const rect = box.current.getBoundingClientRect();
    return valueFromFraction((clientX - rect.left) / rect.width);
  };

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    press.current = { id: e.pointerId, start: { x: e.clientX, y: e.clientY }, cancelled: false, type: e.pointerType };
    setPreview(valueAt(e.clientX));
  };
  const onPointerMove = (e) => {
    const p = press.current;
    if (p && p.id === e.pointerId) {
      // A finger that wanders vertically is scrolling; sideways drags adjust the preview
      if (p.type !== "mouse" && Math.abs(e.clientY - p.start.y) > 10) {
        p.cancelled = true;
        setPreview(null);
        return;
      }
      if (!p.cancelled) setPreview(valueAt(e.clientX));
    } else if (e.pointerType === "mouse") {
      setPreview(valueAt(e.clientX)); // hover preview
    }
  };
  const onPointerUp = (e) => {
    const p = press.current;
    press.current = null;
    if (!p || p.id !== e.pointerId) return;
    e.stopPropagation();
    const tooFar = p.type !== "mouse" && movedTooFar(p.start, { x: e.clientX, y: e.clientY }) && Math.abs(e.clientY - p.start.y) > 10;
    if (!p.cancelled && !tooFar) save(valueAt(e.clientX));
    if (p.type !== "mouse") setPreview(null);
  };
  const cancel = () => {
    if (press.current) press.current.cancelled = true;
    press.current = null;
    setPreview(null);
  };

  const onKeyDown = (e) => {
    const next = valueFromKey(e.key, preview ?? myValue ?? 0);
    if (next === null) return;
    e.preventDefault();
    setPreview(next);
    clearTimeout(keyTimer.current);
    keyTimer.current = setTimeout(() => {
      setPreview(null);
      save(next);
    }, KEY_SAVE_DELAY_MS);
  };

  return (
    <span className={`rating-stars rating-stars--${size}${myValue ? " rating-stars--mine" : ""}`}>
      {myValue !== undefined && myValue !== null && <span className="rating-stars__you">You</span>}
      <span
        ref={box}
        role="slider"
        tabIndex={0}
        aria-label={`Your rating${productName ? ` for ${productName}` : ""}`}
        aria-valuemin={0.5}
        aria-valuemax={5}
        aria-valuenow={preview ?? myValue ?? undefined}
        aria-valuetext={describe(preview ?? myValue)}
        className="rating-stars__control"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={cancel}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse" && !press.current) setPreview(null);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (!keyTimer.current) setPreview(null);
        }}
        onClick={(e) => {
          // Never let the card's link see this click
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Stars value={shown} style={starStyle} />
      </span>
    </span>
  );
}
