// Guard for maintenance scripts: only the staging database or a local database may be touched.
// Production ("bubblydatabase3") is never allowed from a script.

const STAGING_DB = "bubblydatabase3_staging";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

// Pulls the host list and database name out of a mongodb:// or mongodb+srv:// URI
const parseMongoUri = (uri) => {
  const match = /^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)(?:\/([^?]*))?/.exec(
    uri || ""
  );
  if (!match) {
    return null;
  }
  const hosts = match[1]
    .split(",")
    .map((host) => host.replace(/:\d+$/, "").replace(/^\[|\]$/g, ""));
  return { hosts, dbName: decodeURIComponent(match[2] || "") };
};

// Returns { ok, reason }. Never includes credentials in the reason.
const checkStagingUri = (uri) => {
  const parsed = parseMongoUri(uri);
  if (!parsed) {
    return { ok: false, reason: "Refusing to run: MONGODB_URI is not a valid MongoDB URI." };
  }
  const { hosts, dbName } = parsed;
  if (dbName === STAGING_DB) {
    return { ok: true };
  }
  if (hosts.every((host) => LOCAL_HOSTS.has(host))) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: `Refusing to run: database "${dbName || "(none)"}" on ${hosts.join(
      ", "
    )} is not "${STAGING_DB}" or a local database. Scripts never run against production.`,
  };
};

// Exits the process before any connection is made if the URI isn't staging or local
const assertStaging = (uri) => {
  const { ok, reason } = checkStagingUri(uri);
  if (!ok) {
    console.error(reason);
    process.exit(1);
  }
};

module.exports = { STAGING_DB, parseMongoUri, checkStagingUri, assertStaging };
