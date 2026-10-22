import { Link } from "react-router-dom";
import FlavorIcon from "./FlavorIcon";
import { brandStyle } from "../theme/brandColors";
import { formatBrands } from "../../utils/formatBrands";

// Typographic product card: brand color + flavor name + brand name, with the score as the anchor.
// No product photos (CLAUDE.md hard rule 10). The whole card is one link to the product page.
//
//   <ProductCard bubblyWater={bw} />                  full card (lists)
//   <ProductCard bubblyWater={bw} variant="compact" /> one-line card (search, profiles, recent)
//   ratingCount defaults to bubblyWater.ratingCount, then bubblyWater.ratings.length
export default function ProductCard({ bubblyWater, variant = "full", ratingCount, headingLevel = 3 }) {
  const { _id, productName, brandName, flavor = [], averageRating, isCaffeinated, hasCBD } = bubblyWater;
  const count = ratingCount ?? bubblyWater.ratingCount ?? bubblyWater.ratings?.length ?? 0;
  const hasScore = count > 0 && typeof averageRating === "number";
  const Heading = `h${headingLevel}`;

  return (
    <article className={`product-card product-card--${variant} brand-surface`} style={brandStyle(brandName)}>
      <FlavorIcon flavor={flavor[0]} className="product-card__icon" />
      <div className="product-card__names">
        <Heading className="product-card__flavor">
          <Link to={`/bubblyWater/${_id}`} className="product-card__link">
            {productName}
          </Link>
        </Heading>
        <p className="product-card__brand">{formatBrands(brandName)}</p>
        {variant === "full" && (isCaffeinated || hasCBD) && (
          <p className="product-card__tags">
            {isCaffeinated && <span className="product-card__tag">caffeine</span>}
            {hasCBD && <span className="product-card__tag">CBD</span>}
          </p>
        )}
      </div>
      <p className="product-card__score">
        {hasScore ? (
          <>
            <span className="product-card__score-value">{averageRating.toFixed(1)}</span>
            <span className="product-card__score-detail">
              <span className="sr-only"> out of 5, </span>
              <span aria-hidden="true">/5 · </span>
              {count} {count === 1 ? "rating" : "ratings"}
            </span>
          </>
        ) : (
          <span className="product-card__score-detail">
            {variant === "compact" ? "No ratings yet" : "No ratings yet. Be the first fizz critic!"}
          </span>
        )}
      </p>
    </article>
  );
}
