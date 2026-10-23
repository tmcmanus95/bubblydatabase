import { Link } from "react-router-dom";
import FlavorIcon from "./FlavorIcon";
import Stars from "./Stars";
import { brandFontStyle } from "../theme/brandFonts";
import { accentStyle, flavorStyle, starStyle } from "../theme/flavorSurface";
import { formatBrands } from "../../utils/formatBrands";

// Typographic product card: the flavors' colors fill the card (one band per flavor), the brand name
// is set in that brand's font, and the score (number + stars) is the anchor.
// No product photos (CLAUDE.md hard rule 10). The whole card is one link to the product page.
// Every element sits in a fixed slot, so all cards line up whatever their content:
//   full:    brand · icon / name (2 lines) / flavor chips / score + stars · tags
//   compact: icon / brand + name (1 line each) / score + stars
//
//   <ProductCard bubblyWater={bw} />                  full card (lists)
//   <ProductCard bubblyWater={bw} variant="compact" /> one-line card (search, profiles, recent)
//   <ProductCard bubblyWater={bw} variant="hero" headingLevel={1} />  big, not a link (product page)
//   ratingCount defaults to bubblyWater.ratingCount, then bubblyWater.ratings.length
//   score={4.5} scoreDetail="rated" shows one person's rating instead of the average
//   showScore={false} leaves the score slot empty

const MAX_CHIPS = 3;

const flavorLabel = (flavor) => flavor.replace(/-/g, " ");

export default function ProductCard({
  bubblyWater,
  variant = "full",
  ratingCount,
  headingLevel = 3,
  score,
  scoreDetail,
  showScore = true,
}) {
  const { _id, productName, brandName, flavor = [], averageRating, isCaffeinated, hasCBD } = bubblyWater;
  const count = ratingCount ?? bubblyWater.ratingCount ?? bubblyWater.ratings?.length ?? 0;
  const hasOverride = typeof score === "number";
  const hasScore = hasOverride || (count > 0 && typeof averageRating === "number");
  const isLink = variant !== "hero";
  const showChips = variant !== "compact";
  const Heading = `h${headingLevel}`;
  const flavors = flavor.length ? flavor : ["plain"];
  const hiddenChips = flavors.length - MAX_CHIPS;

  return (
    <article className={`product-card product-card--${variant} flavor-surface`} style={flavorStyle(flavors)}>
      <p className="product-card__brand" style={brandFontStyle(brandName)}>
        {formatBrands(brandName)}
      </p>
      <FlavorIcon flavor={flavors[0]} className="product-card__icon" />

      <Heading className="product-card__name">
        {isLink ? (
          <Link to={`/bubblyWater/${_id}`} className="product-card__link">
            {productName}
          </Link>
        ) : (
          productName
        )}
      </Heading>

      {showChips ? (
        <ul className="product-card__flavors" aria-label="Flavors">
          {flavors.slice(0, MAX_CHIPS).map((f) => (
            <li key={f} className="product-card__flavor" style={accentStyle(f)}>
              {flavorLabel(f)}
            </li>
          ))}
          {hiddenChips > 0 && <li className="product-card__flavor">+{hiddenChips}</li>}
        </ul>
      ) : (
        <p className="sr-only">Flavors: {flavors.map(flavorLabel).join(", ")}</p>
      )}

      <p className="product-card__score">
        {!showScore ? null : hasScore ? (
          <>
            <span className="product-card__score-value">{(hasOverride ? score : averageRating).toFixed(1)}</span>
            <span className="product-card__score-detail">
              <Stars value={hasOverride ? score : averageRating} style={starStyle(flavors[0])} />
              <span>
                <span className="sr-only"> out of 5, </span>
                {hasOverride ? scoreDetail : `${count} ${count === 1 ? "rating" : "ratings"}`}
              </span>
            </span>
          </>
        ) : (
          <span className="product-card__score-detail">
            {variant === "compact" ? "No ratings yet" : "No ratings yet. Be the first fizz critic!"}
          </span>
        )}
      </p>

      {showChips && (
        <p className="product-card__tags">
          {isCaffeinated && <span className="product-card__tag">caffeine</span>}
          {hasCBD && <span className="product-card__tag">CBD</span>}
        </p>
      )}
    </article>
  );
}
