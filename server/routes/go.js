const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { BubblyWater, Click } = require("../models");

// Where-to-buy redirect (P15-3): /go/<productId>/<offerId> → the retailer, logging an anonymous click.
// Amazon links are built from the ASIN and AMAZON_ASSOCIATE_TAG (no tag until Amazon approves us); other
// offers use their affiliate URL, else their plain URL. Only active offers and https targets redirect.
const OBJECT_ID = /^[a-f\d]{24}$/i;

const targetFor = (offer) => {
  if (offer.network === "amazon") {
    if (!offer.asin) return null;
    const tag = (process.env.AMAZON_ASSOCIATE_TAG || "").trim();
    return `https://www.amazon.com/dp/${encodeURIComponent(offer.asin)}${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`;
  }
  const url = offer.affiliateUrl || offer.url;
  try {
    return url && new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
};

// Which page on our site the click came from: same-site referrers only, path only (no query string)
const referrerPath = (req) => {
  try {
    const ref = new URL(req.get("referer"));
    return ref.host === req.get("host") ? ref.pathname.slice(0, 200) : undefined;
  } catch {
    return undefined;
  }
};

const notFound = (res) => res.status(404).type("text/plain").send("That link isn't available anymore.");

const createGoRouter = ({ limit = 60 } = {}) => {
  const router = express.Router();
  router.use(rateLimit({ windowMs: 60 * 1000, limit, standardHeaders: "draft-8", legacyHeaders: false }));
  router.get("/:productId/:offerId", async (req, res, next) => {
    try {
      const { productId, offerId } = req.params;
      if (!OBJECT_ID.test(productId) || !OBJECT_ID.test(offerId)) return notFound(res);
      const product = await BubblyWater.findOne({ _id: productId, offers: { $elemMatch: { _id: offerId, active: true } } }, { "offers.$": 1 });
      const offer = product && product.offers[0];
      const target = offer && targetFor(offer);
      if (!target) return notFound(res);
      // Logging never blocks the shopper
      Click.create({ productId, offerId, network: offer.network, referrerPath: referrerPath(req) }).catch((error) =>
        req.log ? req.log.warn({ err: error }, "click not logged") : undefined
      );
      res.set("X-Robots-Tag", "noindex, nofollow");
      res.set("Referrer-Policy", "no-referrer");
      return res.redirect(302, target);
    } catch (error) {
      return next(error);
    }
  });
  return router;
};

module.exports = { createGoRouter, targetFor };
