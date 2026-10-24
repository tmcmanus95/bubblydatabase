// Weekly where-to-buy link check (P15-6): visits each offer's link (HEAD, falling back to GET when a site
// doesn't allow HEAD), and records `status` ("ok" / "broken") and `lastChecked` on the offer. Amazon links
// are skipped: Amazon turns away automated visitors, so a check would mark good links broken (left as is).
const { targetFor } = require("../../routes/go");

const USER_AGENT = "BubblesLinkCheck/1.0 (weekly where-to-buy link check)";

const visit = async (url, fetchImpl, timeoutMs) => {
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetchImpl(url, { method, redirect: "follow", headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) return { ok: true, status: res.status };
      // Some shops refuse HEAD (405/403/501); ask once more with GET before calling it broken
      if (method === "HEAD" && [403, 405, 501].includes(res.status)) continue;
      return { ok: false, status: res.status };
    } catch (error) {
      if (method === "GET") return { ok: false, status: error.name === "TimeoutError" ? "timeout" : "unreachable" };
    }
  }
  return { ok: false, status: "unreachable" };
};

const checkLinks = async (db, { fetchImpl = fetch, dryRun = false, now = () => new Date(), timeoutMs = 10000, concurrency = 4 } = {}) => {
  const products = await db.collection("bubblywaters").find({ "offers.0": { $exists: true } }, { projection: { productName: 1, offers: 1 } }).toArray();
  const jobs = [];
  for (const p of products) for (const offer of p.offers) jobs.push({ product: p, offer });
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const { product, offer } = jobs[next++];
      if (offer.network === "amazon") {
        results.push({ productId: product._id, offerId: offer._id, retailer: offer.retailer, skipped: true });
        continue;
      }
      const url = targetFor(offer);
      const outcome = url ? await visit(url, fetchImpl, timeoutMs) : { ok: false, status: "no-link" };
      results.push({ productId: product._id, productName: product.productName, offerId: offer._id, retailer: offer.retailer, url, ...outcome });
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));

  const checked = results.filter((r) => !r.skipped);
  if (!dryRun && checked.length) {
    const at = now();
    await db.collection("bubblywaters").bulkWrite(
      checked.map((r) => ({
        updateOne: {
          filter: { _id: r.productId, "offers._id": r.offerId },
          update: { $set: { "offers.$.status": r.ok ? "ok" : "broken", "offers.$.lastChecked": at } },
        },
      })),
      { ordered: false }
    );
  }
  return {
    offers: jobs.length,
    checked: checked.length,
    skipped: results.length - checked.length,
    broken: checked.filter((r) => !r.ok).map((r) => ({ product: r.productName, retailer: r.retailer, url: r.url, status: r.status })),
  };
};

module.exports = { checkLinks, USER_AGENT };
