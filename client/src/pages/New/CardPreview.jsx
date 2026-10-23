import { useQuery } from "@apollo/client";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_COLOR_SETTINGS, setColorSettings } from "../../theme/colorSettings";
import { QUERY_ALL_BUBBLYS } from "../../../utils/queries";
import ProductCard from "../../components/ProductCard";
import Loading from "../../components/Loading";

const PATTERNS = ["bands", "waves", "bubbles", "gradient", "stripes"];
const PALETTES = ["aura", "vibrant", "white", "splash"];

// Preview of the product cards with real data. Not linked from the site.
// ?pattern=waves (or bubbles, gradient, stripes, bands) previews a background pattern;
// ?palette=vibrant (or aura, white, splash) previews a color style; ?flavor=lemon shows only cards with that flavor.
export default function CardPreview() {
  const { data, error } = useQuery(QUERY_ALL_BUBBLYS);
  const [params] = useSearchParams();
  const pattern = PATTERNS.includes(params.get("pattern")) ? params.get("pattern") : DEFAULT_COLOR_SETTINGS.pattern;
  const palette = PALETTES.includes(params.get("palette")) ? params.get("palette") : DEFAULT_COLOR_SETTINGS.palette;
  const link = (next) => `?${new URLSearchParams({ pattern, palette, ...(params.get("flavor") ? { flavor: params.get("flavor") } : {}), ...next })}`;
  // Applied during render so the cards below pick it up on the first paint
  setColorSettings({ ...DEFAULT_COLOR_SETTINGS, pattern, palette });
  if (error) return <p className="m-8">Couldn't load bubblies: {error.message}</p>;
  if (!data) return <Loading />;
  const flavor = params.get("flavor");
  const bubblies = flavor
    ? data.bubblyWaters.filter((bw) => bw.flavor.some((f) => f.toLowerCase() === flavor.toLowerCase()))
    : data.bubblyWaters;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-24">
      <h1 className="topBubblysHeader mb-2 text-4xl">Card preview</h1>
      <p className="mb-1">
        Palette:{" "}
        {PALETTES.map((p) => (
          <a key={p} href={link({ palette: p })} className={`mr-3 underline ${p === palette ? "font-bold" : ""}`}>
            {p}
          </a>
        ))}
      </p>
      <p className="mb-6">
        Pattern:{" "}
        {PATTERNS.map((p) => (
          <a key={p} href={link({ pattern: p })} className={`mr-3 underline ${p === pattern ? "font-bold" : ""}`}>
            {p}
          </a>
        ))}
      </p>
      <h2 className="mb-3 text-xl font-semibold">Full</h2>
      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {bubblies.slice(0, 12).map((bw) => (
          <ProductCard key={bw._id} bubblyWater={bw} />
        ))}
      </div>
      <h2 className="mb-3 text-xl font-semibold">Compact</h2>
      <div className="grid max-w-xl gap-4">
        {bubblies.slice(12, 18).map((bw) => (
          <ProductCard key={bw._id} bubblyWater={bw} variant="compact" />
        ))}
      </div>
    </main>
  );
}
