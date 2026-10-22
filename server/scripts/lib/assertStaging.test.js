// Run with `npm test` in server/. No network or database is used: every script must refuse
// before it ever connects. The fake hosts use the reserved .invalid TLD.
const { test } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");
const { checkStagingUri, parseMongoUri } = require("./assertStaging");

const serverDir = path.join(__dirname, "../..");
const PROD_URI =
  "mongodb+srv://someuser:s3cretpass@cluster0.example.invalid/bubblydatabase3?retryWrites=true&w=majority";
const STAGING_URI =
  "mongodb+srv://someuser:s3cretpass@cluster0.example.invalid/bubblydatabase3_staging?retryWrites=true";

test("parses srv, multi-host and IPv6 URIs", () => {
  assert.deepStrictEqual(parseMongoUri(PROD_URI), {
    hosts: ["cluster0.example.invalid"],
    dbName: "bubblydatabase3",
  });
  assert.deepStrictEqual(parseMongoUri("mongodb://a:27017,b:27018/x"), {
    hosts: ["a", "b"],
    dbName: "x",
  });
  assert.deepStrictEqual(parseMongoUri("mongodb://[::1]:27017/x").hosts, ["::1"]);
  assert.strictEqual(parseMongoUri("postgres://nope"), null);
});

test("allows the staging database and local databases", () => {
  assert.ok(checkStagingUri(STAGING_URI).ok);
  assert.ok(checkStagingUri("mongodb://127.0.0.1:27017/bubblywater").ok);
  assert.ok(checkStagingUri("mongodb://localhost/anything").ok);
  assert.ok(checkStagingUri("mongodb://[::1]:27017/x").ok);
});

test("refuses production and anything else remote", () => {
  for (const uri of [
    PROD_URI,
    "mongodb+srv://u:p@cluster0.example.invalid/",
    "mongodb+srv://u:p@cluster0.example.invalid/bubblydatabase3_staging_old",
    "mongodb+srv://u:p@cluster0.example.invalid/BUBBLYDATABASE3_STAGING",
    "mongodb://localhost:27017,cluster0.example.invalid:27017/bubblydatabase3",
    "",
    undefined,
  ]) {
    assert.strictEqual(checkStagingUri(uri).ok, false, String(uri));
  }
});

test("refusal messages never include credentials", () => {
  const { reason } = checkStagingUri(PROD_URI);
  assert.match(reason, /bubblydatabase3/);
  assert.doesNotMatch(reason, /s3cretpass|someuser/);
});

const runScript = (script, uri, args = []) =>
  spawnSync(process.execPath, [script, ...args], {
    cwd: serverDir,
    env: { ...process.env, MONGODB_URI: uri },
    encoding: "utf8",
    timeout: 10000,
  });

// Every script in seeders/ (including ones added later, and gitignored local-only ones) must refuse
// a production URI. Local scripts that still load the retired onRenderConnection.js exit with "retired".
const seederScripts = fs
  .readdirSync(path.join(serverDir, "seeders"))
  .filter((file) => file.endsWith(".js"))
  .map((file) => path.join("seeders", file));

for (const script of seederScripts) {
  test(`${script} refuses a production URI before connecting`, () => {
    const result = runScript(script, PROD_URI, ["--yes-drop-staging"]);
    assert.strictEqual(result.status, 1, result.stderr);
    assert.match(result.stderr, /Refusing to run|retired/);
    assert.doesNotMatch(result.stderr + result.stdout, /s3cretpass/);
  });
}

test("seed.js refuses without --yes-drop-staging, even on staging", () => {
  const result = runScript("seeders/seed.js", STAGING_URI);
  assert.strictEqual(result.status, 1, result.stderr);
  assert.match(result.stderr, /--yes-drop-staging/);
});

test("config/onRenderConnection.js is retired and exits", () => {
  const result = runScript("config/onRenderConnection.js", STAGING_URI);
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr, /retired/);
});
