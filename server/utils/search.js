// One search for products (P1-19): text, flavors, brand, caffeine and CBD filters, sorting and pages, in a
// single aggregation that uses the P1-13 indexes and the stored aggregates (P1-14), so no ratings are
// loaded. Returns { total, page, pageSize, results }.
const { BubblyWater } = require("../models");

const SORTS = {
  TOP_RATED: { avgRating: -1, ratingCount: -1, _id: 1 },
  MOST_RATED: { ratingCount: -1, avgRating: -1, _id: 1 },
  NAME: { productName: 1, _id: 1 },
  NEWEST: { _id: -1 },
};
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 50;

const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildMatch = ({ q, flavor, brand, caffeine, cbd, includeArchived }) => {
  // Archived products never show in search (P2-2), except to admins who ask for them (admin products page)
  const match = includeArchived ? {} : { archivedAt: null };
  const text = (q || "").trim();
  if (text) {
    // Every word must appear somewhere in the name, brand or tags (partial words count: "lim" finds lime)
    match.$and = text
      .split(/\s+/)
      .slice(0, 8)
      .map((word) => {
        const re = { $regex: literal(word), $options: "i" };
        return { $or: [{ productName: re }, { brandName: re }, { tags: re }, { flavor: re }] };
      });
  }
  const flavors = (flavor || []).map((f) => f.trim().toLowerCase()).filter(Boolean);
  if (flavors.length) match.flavor = { $all: flavors };
  if (brand) match.brandName = brand.trim().toLowerCase();
  if (typeof caffeine === "boolean") match.isCaffeinated = caffeine;
  if (typeof cbd === "boolean") match.hasCBD = cbd;
  return match;
};

const searchProducts = async (args) => {
  const pageSize = Math.min(Math.max(args.pageSize || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const page = Math.max(args.page || 1, 1);
  const [result] = await BubblyWater.aggregate([
    { $match: buildMatch(args) },
    {
      $facet: {
        total: [{ $count: "n" }],
        results: [
          { $sort: SORTS[args.sort] || SORTS.TOP_RATED },
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          { $project: { ratings: 0, reviews: 0 } },
        ],
      },
    },
  ]);
  return { total: result.total.length ? result.total[0].n : 0, page, pageSize, results: result.results };
};

module.exports = { searchProducts, buildMatch, SORTS, MAX_PAGE_SIZE };
