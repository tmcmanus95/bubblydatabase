import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { QUERY_ALL_BUBBLYS } from "../../../utils/queries";
import ProductCard from "../../components/ProductCard";
import Loading from "../../components/Loading";
import { DEFAULT_COLOR_SETTINGS, setColorSettings } from "../../theme/colorSettings";
import { FLAVOR_COLORS } from "../../theme/flavorColors";
import { BRAND_COLORS } from "../../theme/brandColors";
import { INK, brandColor, flavorSurface, flavorAccent, flavorStarColor } from "../../theme/flavorSurface";
import { contrastRatio, parseOklch } from "../../theme/color";

// Color Lab (not linked from the site): drag the sliders to tune the card colors live, check that every
// flavor stays readable, then "Copy settings" and paste over DEFAULT_COLOR_SETTINGS in
// client/src/theme/colorSettings.js. Nothing here is saved.

const SLIDERS = [
  { group: "Card background", path: ["card", "light", "lightness"], label: "Light mode: lightness", min: 0.7, max: 0.95 },
  { group: "Card background", path: ["card", "light", "maxChroma"], label: "Light mode: vividness", min: 0, max: 0.3 },
  { group: "Card background", path: ["card", "dark", "lightness"], label: "Dark mode: lightness", min: 0.55, max: 0.9 },
  { group: "Card background", path: ["card", "dark", "maxChroma"], label: "Dark mode: vividness", min: 0, max: 0.3 },
  { group: "Pills + score badge", path: ["pill", "light", "minLightness"], label: "Light mode: darkest allowed", min: 0.55, max: 0.9 },
  { group: "Pills + score badge", path: ["pill", "light", "maxLightness"], label: "Light mode: lightest allowed", min: 0.6, max: 0.95 },
  { group: "Pills + score badge", path: ["pill", "dark", "minLightness"], label: "Dark mode: darkest allowed", min: 0.7, max: 0.98 },
  { group: "Pills + score badge", path: ["pill", "dark", "maxLightness"], label: "Dark mode: lightest allowed", min: 0.75, max: 0.99 },
  { group: "Pills + score badge", path: ["pill", "maxChroma"], label: "Vividness cap", min: 0, max: 0.35 },
  { group: "Stars", path: ["star", "lightModeGapBelowCard"], label: "Light mode: how much darker than the card", min: 0, max: 0.4 },
  { group: "Stars", path: ["star", "darkLightness"], label: "Dark mode: lightness", min: 0.25, max: 0.7 },
  { group: "Bands", path: ["bandAngle"], label: "Band angle (degrees)", min: 0, max: 180, step: 1 },
];

const getPath = (obj, path) => path.reduce((o, k) => o[k], obj);
const setPath = (obj, [key, ...rest], value) =>
  rest.length ? { ...obj, [key]: setPath(obj[key], rest, value) } : { ...obj, [key]: value };

// Lowest text contrast (and the flavor causing it) across every flavor, plus star visibility
const checkReadability = () => {
  const worst = { card: [99, ""], pill: [99, ""], star: [99, ""] };
  for (const flavor of Object.keys(FLAVOR_COLORS)) {
    for (const mode of ["light", "dark"]) {
      const card = flavorSurface(flavor)[mode];
      const cardRatio = contrastRatio(card, INK[mode]);
      const pillRatio = contrastRatio(flavorAccent(flavor)[mode], INK[mode]);
      const starGap = Math.abs(parseOklch(flavorStarColor(flavor)[mode]).l - parseOklch(card).l);
      if (cardRatio < worst.card[0]) worst.card = [cardRatio, `${flavor} (${mode})`];
      if (pillRatio < worst.pill[0]) worst.pill = [pillRatio, `${flavor} (${mode})`];
      if (starGap < worst.star[0]) worst.star = [starGap, `${flavor} (${mode})`];
    }
  }
  return worst;
};

export default function ColorLab() {
  const { data, error } = useQuery(QUERY_ALL_BUBBLYS);
  const [settings, setSettings] = useState(DEFAULT_COLOR_SETTINGS);
  const [version, setVersion] = useState(0);
  const [overrideFlavor, setOverrideFlavor] = useState("lemon");
  const [overrideBrand, setOverrideBrand] = useState("spindrift");
  const [copied, setCopied] = useState(false);

  const apply = (next) => {
    setColorSettings(next);
    setSettings(next);
    setVersion((v) => v + 1);
    setCopied(false);
  };

  const checks = useMemo(checkReadability, [version]);
  const snippet = `export const DEFAULT_COLOR_SETTINGS = ${JSON.stringify(settings, null, 2)};\n`;

  if (error) return <p className="m-8">Couldn't load bubblies: {error.message}</p>;
  if (!data) return <Loading />;
  const sample = data.bubblyWaters.slice(0, 6);

  const status = (ok) => (ok ? "✅" : "⚠️");
  const groups = [...new Set(SLIDERS.map((s) => s.group))];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-24">
      <h1 className="topBubblysHeader mb-2 text-4xl">Color Lab</h1>
      <p className="mb-6 max-w-3xl">
        Drag the sliders and the cards update live. When you like it, click <b>Copy settings</b> and paste the
        result over <code>DEFAULT_COLOR_SETTINGS</code> in <code>client/src/theme/colorSettings.js</code>. Nothing
        here is saved.
      </p>

      <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
        <section aria-label="Settings" className="flex flex-col gap-6">
          {groups.map((group) => (
            <fieldset key={group} className="rounded-lg border-2 border-current p-3">
              <legend className="px-1 font-bold">{group}</legend>
              {SLIDERS.filter((s) => s.group === group).map((s) => {
                const value = getPath(settings, s.path);
                const id = s.path.join("-");
                return (
                  <label key={id} htmlFor={id} className="mb-2 block text-sm">
                    <span className="flex justify-between">
                      <span>{s.label}</span>
                      <span className="font-mono">{value}</span>
                    </span>
                    <input
                      id={id}
                      type="range"
                      className="w-full"
                      min={s.min}
                      max={s.max}
                      step={s.step || 0.01}
                      value={value}
                      onChange={(e) => apply(setPath(settings, s.path, Number(e.target.value)))}
                    />
                  </label>
                );
              })}
            </fieldset>
          ))}

          <fieldset className="rounded-lg border-2 border-current p-3">
            <legend className="px-1 font-bold">Background pattern</legend>
            <select
              aria-label="Background pattern"
              className="text-black"
              value={settings.pattern}
              onChange={(e) => apply({ ...settings, pattern: e.target.value })}
            >
              {["bands", "waves", "bubbles", "gradient", "stripes"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </fieldset>

          <fieldset className="rounded-lg border-2 border-current p-3">
            <legend className="px-1 font-bold">Change a brand's border color</legend>
            <div className="flex items-center gap-2 text-sm">
              <select value={overrideBrand} onChange={(e) => setOverrideBrand(e.target.value)} className="text-black">
                {Object.keys(BRAND_COLORS).map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
              <input
                type="color"
                aria-label={`Border color for ${overrideBrand}`}
                value={brandColor(overrideBrand)}
                onChange={(e) =>
                  apply({ ...settings, brandColorOverrides: { ...settings.brandColorOverrides, [overrideBrand]: e.target.value } })
                }
              />
            </div>
            <ul className="mt-2 text-sm">
              {Object.entries(settings.brandColorOverrides).map(([b, c]) => (
                <li key={b} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full border border-current" style={{ background: c }} />
                  {b}: {c}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      const { [b]: _removed, ...rest } = settings.brandColorOverrides;
                      apply({ ...settings, brandColorOverrides: rest });
                    }}
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>

          <fieldset className="rounded-lg border-2 border-current p-3">
            <legend className="px-1 font-bold">Change one flavor's color</legend>
            <div className="flex items-center gap-2 text-sm">
              <select value={overrideFlavor} onChange={(e) => setOverrideFlavor(e.target.value)} className="text-black">
                {Object.keys(FLAVOR_COLORS).map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <input
                type="color"
                aria-label={`Color for ${overrideFlavor}`}
                value={/^#[0-9a-f]{6}$/i.test(settings.flavorOverrides[overrideFlavor] || "") ? settings.flavorOverrides[overrideFlavor] : "#ffffff"}
                onChange={(e) =>
                  apply({ ...settings, flavorOverrides: { ...settings.flavorOverrides, [overrideFlavor]: e.target.value } })
                }
              />
            </div>
            <ul className="mt-2 text-sm">
              {Object.entries(settings.flavorOverrides).map(([f, c]) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full border border-current" style={{ background: c }} />
                  {f}: {c}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      const { [f]: _removed, ...rest } = settings.flavorOverrides;
                      apply({ ...settings, flavorOverrides: rest });
                    }}
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>

          <section aria-label="Readability check" className="rounded-lg border-2 border-current p-3 text-sm">
            <h2 className="mb-1 font-bold">Readability (all {Object.keys(FLAVOR_COLORS).length} flavors)</h2>
            <p>
              {status(checks.card[0] >= 4.5)} Card text: worst {checks.card[0].toFixed(1)}:1 ({checks.card[1]}), needs 4.5
            </p>
            <p>
              {status(checks.pill[0] >= 4.5)} Pill text: worst {checks.pill[0].toFixed(1)}:1 ({checks.pill[1]}), needs 4.5
            </p>
            <p>
              {status(checks.star[0] >= 0.08)} Stars vs card: smallest gap {checks.star[0].toFixed(2)} ({checks.star[1]}), needs 0.08
            </p>
          </section>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border-2 border-current px-4 py-1 font-bold"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(snippet);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied!" : "Copy settings"}
            </button>
            <button type="button" className="rounded-full border-2 border-current px-4 py-1" onClick={() => apply(DEFAULT_COLOR_SETTINGS)}>
              Reset
            </button>
          </div>
          <textarea readOnly value={snippet} rows={8} className="w-full font-mono text-xs text-black" aria-label="Settings to paste" />
        </section>

        <section aria-label="Preview" className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl bg-white p-4">
            <h2 className="mb-3 font-bold text-black">Light mode</h2>
            <div className="grid gap-5">
              {sample.slice(0, 3).map((bw) => (
                <ProductCard key={`${bw._id}-l-${version}`} bubblyWater={bw} mode="light" />
              ))}
              <ProductCard key={`${sample[3]?._id}-lc-${version}`} bubblyWater={sample[3]} mode="light" variant="compact" />
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "#0f172a" }}>
            <h2 className="mb-3 font-bold text-white">Dark mode</h2>
            <div className="grid gap-5">
              {sample.slice(0, 3).map((bw) => (
                <ProductCard key={`${bw._id}-d-${version}`} bubblyWater={bw} mode="dark" />
              ))}
              <ProductCard key={`${sample[4]?._id}-dc-${version}`} bubblyWater={sample[4] || sample[3]} mode="dark" variant="compact" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
