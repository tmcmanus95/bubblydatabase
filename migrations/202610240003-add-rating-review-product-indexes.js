// P1-13 step 2: indexes for the queries the site runs most (product pages, profiles, recent activity, top
// lists, flavor and brand pages), plus one rating per user per product. Runs after
// 202610240002 has removed duplicates. The same indexes are declared in the Mongoose models (same names
// and options), so the app's own index sync treats them as already there.
const INDEXES = {
  ratings: [
    [{ bubblyWater: 1 }, { name: "bubblyWater_1" }],
    [{ user: 1, createdAt: -1 }, { name: "user_1_createdAt_-1" }],
    [{ createdAt: -1 }, { name: "createdAt_-1" }],
    // One rating per user per product. Partial: only ratings that have a user count.
    [{ user: 1, bubblyWater: 1 }, { name: "user_1_bubblyWater_1", unique: true, partialFilterExpression: { user: { $type: "objectId" } } }],
  ],
  reviews: [
    [{ bubblyWater: 1, createdAt: -1 }, { name: "bubblyWater_1_createdAt_-1" }],
    [{ user: 1, createdAt: -1 }, { name: "user_1_createdAt_-1" }],
    [{ createdAt: -1 }, { name: "createdAt_-1" }],
  ],
  bubblywaters: [
    [{ flavor: 1, averageRating: -1 }, { name: "flavor_1_averageRating_-1" }],
    [{ brandName: 1 }, { name: "brandName_1" }],
    [{ averageRating: -1 }, { name: "averageRating_-1" }],
  ],
};

module.exports = {
  description: "Indexes on ratings, reviews and bubblywaters; unique (user, product) rating",
  INDEXES,
  up: async (db) => {
    for (const [collection, list] of Object.entries(INDEXES)) {
      for (const [keys, options] of list) await db.collection(collection).createIndex(keys, options);
    }
  },
  down: async (db) => {
    for (const [collection, list] of Object.entries(INDEXES)) {
      const existing = new Set((await db.collection(collection).indexes()).map((i) => i.name));
      for (const [, { name }] of list) if (existing.has(name)) await db.collection(collection).dropIndex(name);
    }
  },
};
