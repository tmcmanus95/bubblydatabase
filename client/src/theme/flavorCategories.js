// Groups flavors into a handful of categories, each with its own icon (FlavorIcon.jsx).
// Flavor values are stored lowercase with dashes, e.g. "blood-orange".

export const FLAVOR_CATEGORIES = {
  citrus: [
    "lime", "key-lime", "lemon", "lemonade", "pink-lemonade", "lemon-sorbet", "limoncello", "orange",
    "orange-cream", "blood-orange", "grapefruit", "pomelo", "mandarin", "clementine", "tangerine",
    "calamansi", "yuzu", "citrus",
  ],
  berry: [
    "berry", "blueberry", "raspberry", "strawberry", "blackberry", "cranberry", "currant", "huckleberry",
    "sea-berry", "acai", "grape", "pomegranate",
  ],
  stone: ["cherry", "black-cherry", "peach", "nectarine", "apricot", "plum"],
  tropical: ["pineapple", "mango", "coconut", "passionfruit", "guava", "dragon-fruit", "lychee", "banana", "kiwi", "fruit-punch"],
  orchard: ["apple", "apple-cider", "pear", "pumpkin"],
  melon: ["watermelon", "melon", "cucumber"],
  botanical: [
    "mint", "peppermint", "mojito", "basil", "sage", "lemongrass", "lavender", "rose", "rosé", "hibiscus",
    "elderflower", "honeysuckle", "wildflower", "sweetgrass", "cactus", "agave", "mushroom",
  ],
  spice: ["ginger", "cinnamon", "chai", "cardamom", "chili", "black-pepper", "turmeric", "vanilla", "honey"],
  brewed: ["tea", "black-tea", "green-tea", "cola", "root-beer", "green-bean"],
  plain: ["plain"],
};

const CATEGORY_BY_FLAVOR = new Map(
  Object.entries(FLAVOR_CATEGORIES).flatMap(([category, flavors]) => flavors.map((f) => [f, category]))
);

// Category for a flavor; anything unknown gets "bubbles"
export function flavorCategory(flavor) {
  const key = String(flavor || "").trim().toLowerCase().replace(/\s+/g, "-");
  return CATEGORY_BY_FLAVOR.get(key) || "bubbles";
}
