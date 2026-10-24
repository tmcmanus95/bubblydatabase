const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { startTestServer } = require("./helpers");
const { BubblyWater } = require("../models");
const { sendEmail } = require("../utils/sendEmail");

let t;

before(async () => {
  t = await startTestServer();
});

after(async () => {
  await t.stop();
});

test("GraphQL endpoint answers", async () => {
  const res = await t.gql("{ __typename }");
  assert.deepStrictEqual(res, { data: { __typename: "Query" } });
});

test("resolvers read from the test database", async () => {
  await BubblyWater.create({ productName: "Lime", brandName: "la-croix", flavor: ["lime"] });
  const res = await t.gql("{ search { results { productName brandName } } }");
  assert.deepStrictEqual(res.data.search.results, [{ productName: "Lime", brandName: "la-croix" }]);
});

test("email is captured, not sent, in log mode", async () => {
  await sendEmail({ to: "someone@example.test", subject: "Hi", text: "fizz" });
  assert.strictEqual(t.outbox.length, 1);
  assert.strictEqual(t.outbox[0].to, "someone@example.test");
});
