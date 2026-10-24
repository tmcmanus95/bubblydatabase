// Every GraphQL operation the client sends must be valid against the server schema, so removing or renaming
// a server field can't silently break a page (checked on every PR).
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { buildSchema, parse, validate } = require("graphql");
const typeDefs = require("../schemas/typeDefs");

const schema = buildSchema(typeDefs);
const CLIENT = path.join(__dirname, "../../client");

// The text of every gql`...` template in the client (none of ours use ${} interpolation)
const operations = () => {
  const files = ["utils/queries.js", "utils/mutations.js"];
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : /\.(jsx?|tsx?)$/.test(d.name) ? [path.relative(CLIENT, path.join(dir, d.name))] : []
    );
  const all = [...new Set([...files, ...walk(path.join(CLIENT, "src"))])];
  const found = [];
  for (const file of all) {
    const text = fs.readFileSync(path.join(CLIENT, file), "utf8");
    for (const m of text.matchAll(/gql`([^`]*)`/g)) found.push({ file, source: m[1] });
  }
  // Inline query strings sent with fetch() (e.g. logout, token upgrade)
  for (const file of ["utils/auth.js"]) {
    const text = fs.readFileSync(path.join(CLIENT, file), "utf8");
    for (const m of text.matchAll(/query: "([^"]+)"/g)) found.push({ file, source: m[1] });
  }
  return found;
};

test("every client query and mutation is valid against the schema", () => {
  const ops = operations();
  assert.ok(ops.length > 30, `found ${ops.length} operations`);
  const problems = [];
  for (const { file, source } of ops) {
    const errors = validate(schema, parse(source));
    for (const e of errors) problems.push(`${file}: ${e.message}`);
  }
  assert.deepStrictEqual(problems, []);
});
