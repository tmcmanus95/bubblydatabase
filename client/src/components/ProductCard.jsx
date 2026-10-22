import { Link } from "react-router-dom";
import FlavorIcon from "./FlavorIcon";
import { brandStyle } from "../theme/brandColors";
import { flavorColor } from "../theme/flavorColors";
import { formatBrands } from "../../utils/formatBrands";

// Typographic product card: brand color + flavor name + brand name, with the score as the anchor.
// No product photos (CLAUDE.md hard rule 10). The whole card is one link to the product page.
// Every element sits in a fixed slot, so all cards line up whatever their content:
//   full:    [flavor stripe] brand · icon / name (2 lines) / flavor chips / score · tags
//   compact: [flavor stripe] icon / brand + name (1 line each) / score
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
    <article className={`product-card product-card--${variant} brand-surface`} style={brandStyle(brandName)}>
      <div className="product-card__stripe" aria-hidden="true">
        {flavors.map((f) => (
          <span key={f} style={{ backgroundColor: flavorColor(f) }} />
        ))}
      </div>

      <p className="product-card__brand">{formatBrands(brandName)}</p>
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
            <li key={f} className="product-card__flavor">
              <span className="product-card__dot" style={{ backgroundColor: flavorColor(f) }} aria-hidden="true" />
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
              <span className="sr-only"> out of 5, </span>
              <span aria-hidden="true">/5 · </span>
              {hasOverride ? scoreDetail : `${count} ${count === 1 ? "rating" : "ratings"}`}
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
