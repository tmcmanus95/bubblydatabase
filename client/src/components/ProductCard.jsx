import { Link } from "react-router-dom";
import FitText from "./FitText";
import Stars from "./Stars";
import { brandFontStyle } from "../theme/brandFonts";
import { getColorSettings } from "../theme/colorSettings";
import { accentStyle, brandStyle, flavorStyle, popStyle, starStyle } from "../theme/flavorSurface";
import { formatBrands } from "../../utils/formatBrands";

// Typographic product card: the flavors' colors fill the card (in the pattern from colorSettings.js),
// the border is the brand's package color, the brand name is set in that brand's font (shrunk to fit),
// and the score badge + stars are the anchor.
// No product photos (CLAUDE.md hard rule 10). The whole card is one link to the product page.
// Every element sits in a fixed slot, so all cards line up whatever their content:
//   full/hero: brand · score badge / name (2 lines) · badge / flavor pills · tags / stars (centered)
//   compact:   brand + name (1 line each) / score + stars
//
//   <ProductCard bubblyWater={bw} />                  full card (lists)
//   <ProductCard bubblyWater={bw} variant="compact" /> one-line card (search, profiles, recent)
//   <ProductCard bubblyWater={bw} variant="hero" headingLevel={1} />  big, not a link (product page)
//   ratingCount defaults to bubblyWater.ratingCount, then bubblyWater.ratings.length
//   score={4.5} scoreDetail="rated" shows one person's rating instead of the average
//   showScore={false} leaves the score slot empty
//   mode="light" | "dark" forces one color mode regardless of the OS setting (the Color Lab uses it)

const MAX_CHIPS = 3;

// Brand name size range (rem) per variant: starts at max, shrinks to fit
const BRAND_SIZE = { full: [1.55, 0.85], compact: [1.1, 0.7], hero: [2.1, 1.1] };

const flavorLabel = (flavor) => flavor.replace(/-/g, " ");

export default function ProductCard({
  bubblyWater,
  variant = "full",
  ratingCount,
  headingLevel = 3,
  score,
  scoreDetail,
  showScore = true,
  mode,
}) {
  const { _id, productName, brandName, flavor = [], averageRating, isCaffeinated, hasCBD } = bubblyWater;
  const count = ratingCount ?? bubblyWater.ratingCount ?? bubblyWater.ratings?.length ?? 0;
  const hasOverride = typeof score === "number";
  const hasScore = hasOverride || (count > 0 && typeof averageRating === "number");
  const shownScore = hasOverride ? score : averageRating;
  const isLink = variant !== "hero";
  const showChips = variant !== "compact";
  const Heading = `h${headingLevel}`;
  const flavors = flavor.length ? flavor : ["plain"];
  const hiddenChips = flavors.length - MAX_CHIPS;
  const hasTags = showChips && (isCaffeinated || hasCBD);
  const waves = getColorSettings().pattern === "waves" ? " flavor-surface--waves" : "";

  return (
    <article
      className={`product-card product-card--${variant} flavor-surface${waves}${hasTags ? " product-card--has-tags" : ""}`}
      style={{ ...flavorStyle(flavors, mode), ...popStyle(flavors[0], mode), ...brandStyle(brandName) }}
    >
      <FitText
        as="p"
        className="product-card__brand"
        style={brandFontStyle(brandName)}
        maxRem={BRAND_SIZE[variant][0]}
        minRem={BRAND_SIZE[variant][1]}
      >
        {formatBrands(brandName)}
      </FitText>

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
            <li key={f} className="product-card__flavor" style={accentStyle(f, mode)}>
              {flavorLabel(f)}
            </li>
          ))}
          {hiddenChips > 0 && <li className="product-card__flavor">+{hiddenChips}</li>}
        </ul>
      ) : (
        <p className="sr-only">Flavors: {flavors.map(flavorLabel).join(", ")}</p>
      )}

      <p className="product-card__score" style={variant === "compact" ? undefined : accentStyle(flavors[0], mode)}>
        {!showScore ? null : hasScore ? (
          <>
            <span className="product-card__score-value">{shownScore.toFixed(1)}</span>
            <span className="product-card__score-detail">
              <span className="sr-only"> out of 5, </span>
              {hasOverride ? scoreDetail : `${count} ${count === 1 ? "rating" : "ratings"}`}
            </span>
          </>
        ) : (
          <span className="product-card__score-detail">{variant === "compact" ? "No ratings yet" : "New!"}</span>
        )}
      </p>

      {/* Its own slot: big enough to become the tap-to-rate control later (roadmap P1-21) */}
      <div className="product-card__stars">
        {showScore && hasScore && <Stars value={shownScore} style={starStyle(flavors[0], mode)} />}
        {showScore && !hasScore && variant !== "compact" && (
          <span className="product-card__score-detail">No ratings yet. Be the first fizz critic!</span>
        )}
      </div>

      {hasTags && (
        <p className="product-card__tags">
          {isCaffeinated && <span className="product-card__tag">caffeine</span>}
          {hasCBD && <span className="product-card__tag">CBD</span>}
        </p>
      )}
    </article>
  );
}
