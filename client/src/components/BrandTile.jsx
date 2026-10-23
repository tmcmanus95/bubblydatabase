import { Link } from "react-router-dom";
import FitText from "./FitText";
import { formatBrands } from "../../utils/formatBrands";
import { brandFontStyle } from "../theme/brandFonts";
import { brandStyle } from "../theme/flavorSurface";

// A brand as type, never a logo (CLAUDE.md rule 10): its name in its brand font on a sticker framed in the
// brand's package color. "hero" is the large, non-link header on the brand page.
export default function BrandTile({ brandName, variant = "tile" }) {
  const name = (
    <FitText
      className="brand-tile__name"
      style={brandFontStyle(brandName)}
      maxRem={variant === "hero" ? 4 : 1.9}
      minRem={variant === "hero" ? 1.6 : 0.6}
    >
      {formatBrands(brandName)}
    </FitText>
  );
  if (variant === "hero") {
    return (
      <h1 className="brand-tile brand-tile--hero" style={brandStyle(brandName)}>
        {name}
      </h1>
    );
  }
  return (
    <Link to={`/brands/${brandName}`} className="brand-tile" style={brandStyle(brandName)}>
      {name}
    </Link>
  );
}
