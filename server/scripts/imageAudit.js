// Read-only report of where product images come from (P1-0). Staging or local databases only.
// Never fetches the images themselves (CLAUDE.md hard rule 10).
//
//   node scripts/imageAudit.js            uses MONGODB_URI from server/.env (staging)
const db = require("./lib/stagingConnection");
const { BubblyWater } = require("../models");

// Hosts we control. Empty today: every product image is hotlinked from someone else.
const OWN_HOSTS = new Set([]);

const classify = (host) => (OWN_HOSTS.has(host) ? "own" : "third-party hotlink");

const main = async () => {
  await db.asPromise();
  const products = await BubblyWater.find({}, { imageURL: 1, brandName: 1 }).lean();

  const byHost = new Map();
  let missing = 0;
  let invalid = 0;
  let insecure = 0;
  const urlCounts = new Map();

  for (const { imageURL } of products) {
    if (!imageURL || !imageURL.trim()) {
      missing += 1;
      continue;
    }
    let url;
    try {
      url = new URL(imageURL.trim());
    } catch {
      invalid += 1;
      continue;
    }
    if (url.protocol !== "https:") insecure += 1;
    byHost.set(url.host, (byHost.get(url.host) || 0) + 1);
    urlCounts.set(url.href, (urlCounts.get(url.href) || 0) + 1);
  }

  const hosts = [...byHost.entries()].sort((a, b) => b[1] - a[1]);
  const duplicates = [...urlCounts.values()].filter((n) => n > 1).length;

  console.log(JSON.stringify(
    {
      database: db.name,
      products: products.length,
      withImage: products.length - missing - invalid,
      missing,
      invalid,
      notHttps: insecure,
      urlsUsedByMoreThanOneProduct: duplicates,
      distinctHosts: hosts.length,
      byClass: hosts.reduce((acc, [host, n]) => {
        const c = classify(host);
        acc[c] = (acc[c] || 0) + n;
        return acc;
      }, {}),
      hosts: hosts.map(([host, count]) => ({ host, count, class: classify(host) })),
    },
    null,
    2
  ));
};

main()
  .catch((err) => {
    console.error(`imageAudit failed: ${err.message.replace(/\/\/[^@/\s]*@/g, "//<redacted>@")}`);
    process.exitCode = 1;
  })
  .finally(() => db.close());
