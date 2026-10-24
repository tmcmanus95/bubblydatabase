// P15-7: awards and badges must never reward clicking or buying (SPEC). Only the redirect may write clicks,
// and nothing about badges/awards/leaderboards may read clicks or offers.
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const SOURCES = ["server", "client/src", "client/utils"];
const SKIP = /node_modules|\/dist\/|\/tests\/|\.test\.js$/;

const files = () => {
  const out = [];
  const walk = (dir) => {
    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, d.name);
      if (SKIP.test(p)) continue;
      if (d.isDirectory()) walk(p);
      else if (/\.(jsx?|mjs|cjs)$/.test(d.name)) out.push(p);
    }
  };
  SOURCES.forEach((s) => walk(path.join(ROOT, s)));
  return out;
};
const rel = (p) => path.relative(ROOT, p);

// Code that uses the click log: the model, its import, or the collection by name (not the word "click")
const USES_CLICKS = /\bClick\s*\.\s*\w+\(|\{[^}]*\bClick\b[^}]*\}\s*=\s*require|require\([^)]*\/Click["']\)|collection\(\s*["']clicks["']\s*\)/;
// Code that reads offers (the field or the admin/public queries)
const USES_OFFERS = /\.offers\b|offers\s*:|adminOffers|\bsponsored\b/;
// Award-like code: by file name, or by using a badge/award/achievement model or collection
const IS_AWARDS = (file, text) =>
  /badge|award|leaderboard|achievement/i.test(rel(file)) || /\b(Badge|Award|Achievement)\s*\.\s*\w+\(|collection\(\s*["'](badges|awards|achievements)["']/.test(text);

// The only code allowed to touch the click log
const CLICK_ALLOWED = new Set(["server/models/Click.js", "server/models/index.js", "server/routes/go.js"]);

test("only the redirect touches the click log", () => {
  const offenders = files()
    .filter((f) => !CLICK_ALLOWED.has(rel(f)))
    .filter((f) => USES_CLICKS.test(fs.readFileSync(f, "utf8")))
    .map(rel);
  assert.deepStrictEqual(offenders, []);
});

test("badge, award and leaderboard code never reads clicks or offers", () => {
  const offenders = files()
    .filter((f) => IS_AWARDS(f, fs.readFileSync(f, "utf8")))
    .filter((f) => USES_CLICKS.test(fs.readFileSync(f, "utf8")) || USES_OFFERS.test(fs.readFileSync(f, "utf8")))
    .map(rel);
  assert.deepStrictEqual(offenders, []);
});

test("the guard itself catches offenders", () => {
  assert.ok(USES_CLICKS.test('const { Click } = require("../models");'));
  assert.ok(USES_CLICKS.test('await db.collection("clicks").countDocuments()'));
  assert.ok(!USES_CLICKS.test("Click the link sent to your email"));
  assert.ok(USES_OFFERS.test("product.offers.filter(o => o.active)"));
  assert.ok(IS_AWARDS("/x/server/utils/badges.js", ""));
  assert.ok(IS_AWARDS("/x/a.js", "await Badge.create({})"));
  assert.ok(!IS_AWARDS("/x/client/src/pages/New/ColorLab.jsx", "the score badge color"));
});
