import Auth from "../../utils/auth";
import { useLocation } from "react-router-dom";
import Stars from "./Stars";
import RatingStars from "./RatingStars";
import { starStyle } from "../theme/flavorSurface";

// Stars for a rating, in the flavor's star color (P1-21 replaced the MUI rating here). Interactive (tap to
// rate) for a logged-in visitor when given a product and not `readOnly`; otherwise read-only stars showing
// `rating`. Your own ratings come from the shared batched store (utils/myRatings.js), so a page of these
// makes one request instead of one per product (P1-22).
export default function CustomColorRating({ flavor, rating, size, bubblyWaterId, readOnly, productName }) {
  const location = useLocation();
  const onProfile = location.pathname === "/me" || location.pathname.startsWith("/user/");
  const style = starStyle(String(flavor || "plain").toLowerCase());
  if (!readOnly && bubblyWaterId && Auth.loggedIn() && !onProfile) {
    return (
      <RatingStars
        productId={bubblyWaterId}
        productName={productName}
        average={rating}
        starStyle={style}
        size={size === "large" ? "large" : "card"}
      />
    );
  }
  return (
    <span className={size === "small" ? "rating-stars--small" : undefined}>
      <Stars value={rating || 0} style={style} />
      <span className="sr-only">{rating ? `${rating} out of 5 stars` : "Not rated"}</span>
    </span>
  );
}
