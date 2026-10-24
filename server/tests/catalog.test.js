// P0-11 smoke tests: search, flavor/brand lists, the home page top list, and the product page.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const { startTestServer } = require("./helpers");
const { createUser, createBubbly, addRatingFor } = require("./fixtures");
const { BubblyWater, Review } = require("../models");

let t;

before(async () => {
  t = await startTestServer();
  await BubblyWater.init(); // text index used by general search
});
after(() => t.stop());
beforeEach(() => t.reset());

const names = (list) => list.map((b) => b.productName).sort();

const seedCatalog = async () => {
  const lime = await createBubbly({ productName: "Lime", brandName: "la-croix", flavor: ["lime"], tags: ["lime", "la croix"] });
  const pamp = await createBubbly({ productName: "Pamplemousse", brandName: "la-croix", flavor: ["grapefruit"], tags: ["grapefruit"] });
  const keyLime = await createBubbly({ productName: "Key Lime", brandName: "spindrift", flavor: ["lime"], tags: ["key lime"] });
  const buzz = await createBubbly({ productName: "Buzz Cola", brandName: "zappy", flavor: ["cola"], tags: ["cola"], isCaffeinated: true });
  return { lime, pamp, keyLime, buzz };
};

test("general search finds products by name, brand and tags", async () => {
  await seedCatalog();
  const SEARCH = `query($s: String) { searchGeneralBubblyWater(searchTerm: $s) { productName } }`;
  assert.deepStrictEqual(names((await t.gql(SEARCH, { s: "lime" })).data.searchGeneralBubblyWater), ["Key Lime", "Lime"]);
  assert.deepStrictEqual(names((await t.gql(SEARCH, { s: "spindrift" })).data.searchGeneralBubblyWater), ["Key Lime"]);
  assert.deepStrictEqual((await t.gql(SEARCH, { s: "nothingmatches" })).data.searchGeneralBubblyWater, []);
});

test("partial product-name search is case-insensitive", async () => {
  await seedCatalog();
  const res = await t.gql(`{ searchVagueProductName(productName: "LIME") { productName } }`);
  assert.deepStrictEqual(names(res.data.searchVagueProductName), ["Key Lime", "Lime"]);
});

test("flavor, brand, caffeine and CBD lists", async () => {
  await seedCatalog();
  assert.deepStrictEqual(names((await t.gql(`{ flavors(flavor: ["lime"]) { productName } }`)).data.flavors), ["Key Lime", "Lime"]);
  assert.deepStrictEqual(names((await t.gql(`{ brand(brandName: "la-croix") { productName } }`)).data.brand), ["Lime", "Pamplemousse"]);
  assert.deepStrictEqual(names((await t.gql(`{ caffeinatedBubblys { productName } }`)).data.caffeinatedBubblys), ["Buzz Cola"]);
  assert.deepStrictEqual((await t.gql(`{ cbdBubblys { productName } }`)).data.cbdBubblys, []);
});

test("home page top list ranks by average and needs more than 3 ratings", async () => {
  const { lime, pamp, keyLime } = await seedCatalog();
  const raters = await Promise.all([1, 2, 3, 4].map(() => createUser()));
  for (const r of raters) {
    await addRatingFor(r, lime, 3);
    await addRatingFor(r, pamp, 5);
  }
  await addRatingFor(raters[0], keyLime, 5); // only 1 rating: not ranked

  const res = await t.gql(`{ bubblyWaters { productName averageRating } }`);
  assert.ifError(res.errors);
  assert.deepStrictEqual(res.data.bubblyWaters, [
    { productName: "Pamplemousse", averageRating: 5 },
    { productName: "Lime", averageRating: 3 },
  ]);
});

test("product page shows ratings and reviews with public user info only", async () => {
  const { lime } = await seedCatalog();
  const reviewer = await createUser({ username: "critic", email: "critic@example.test" });
  const rating = await addRatingFor(reviewer, lime, 4.5);
  const review = await Review.create({ reviewText: "Tastes like a lime fell in nearby.", user: reviewer._id, bubblyWater: lime._id, rating: rating._id });
  await BubblyWater.updateOne({ _id: lime._id }, { $push: { reviews: review._id } });

  const PRODUCT = `query($id: ID) { bubblyWater(bubblyWaterId: $id) {
    productName brandName flavor
    ratings { rating user { username email } }
    reviews { reviewText likes user { username email } rating { rating } }
  } }`;
  const res = await t.gql(PRODUCT, { id: String(lime._id) });
  assert.ifError(res.errors);
  const page = res.data.bubblyWater;
  assert.strictEqual(page.productName, "Lime");
  assert.deepStrictEqual(page.ratings, [{ rating: 4.5, user: { username: "critic", email: null } }]);
  assert.deepStrictEqual(page.reviews, [
    { reviewText: "Tastes like a lime fell in nearby.", likes: 0, user: { username: "critic", email: null }, rating: { rating: 4.5 } },
  ]);
});

test("an unknown product id returns null instead of crashing", async () => {
  const res = await t.gql(`{ bubblyWater(bubblyWaterId: "000000000000000000000000") { productName } }`);
  assert.ifError(res.errors);
  assert.strictEqual(res.data.bubblyWater, null);
});

test("a profile reports its rating and review totals and a full breakdown", async () => {
  const { lime, pamp } = await seedCatalog();
  const fan = await createUser();
  await addRatingFor(fan, lime, 5);
  await addRatingFor(fan, pamp, 3.5);
  await Review.create({ reviewText: "Zingy", user: fan._id, bubblyWater: lime._id });
  const res = await t.gql(`query($id: ID!) { user(userId: $id) { ratingCount reviewCount ratingBreakdown { rating count } } }`, { id: String(fan._id) });
  assert.ifError(res.errors);
  assert.strictEqual(res.data.user.ratingCount, 2);
  assert.strictEqual(res.data.user.reviewCount, 1);
  const breakdown = Object.fromEntries(res.data.user.ratingBreakdown.map((b) => [b.rating, b.count]));
  assert.deepStrictEqual([breakdown[5], breakdown[3.5], breakdown[1]], [1, 1, 0]);
});
