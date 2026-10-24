const { z } = require("zod");

// One place a product can be bought (P15). Validated with zod for the admin mutations (P15-2); stored as a
// subdocument on the product (models/BubblyWater.js). Amazon offers keep only the ASIN: the link is built
// at redirect time from the ASIN and AMAZON_ASSOCIATE_TAG (P15-3). No Amazon product data or images are
// stored (CLAUDE.md rule 11).
const NETWORKS = ["amazon", "impact", "cj", "awin", "rakuten", "direct"];
const STATUSES = ["unknown", "ok", "broken"];

const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((u) => {
    try {
      return new URL(u).protocol === "https:";
    } catch {
      return false;
    }
  }, "Links must be full https:// URLs");

const offerInput = z
  .object({
    retailer: z.string().trim().min(1, "Retailer is required").max(60),
    network: z.enum(NETWORKS),
    asin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{10}$/, "An ASIN is 10 letters/numbers")
      .nullish(),
    url: httpsUrl.nullish(),
    affiliateUrl: httpsUrl.nullish(),
    packSize: z.string().trim().max(40).nullish(),
    active: z.boolean().default(true),
  })
  .refine((o) => (o.network === "amazon" ? Boolean(o.asin) : Boolean(o.url || o.affiliateUrl)), {
    message: "Amazon offers need an ASIN; other offers need a URL",
    path: ["url"],
  });

module.exports = { offerInput, NETWORKS, STATUSES };
