// Retired: this file used to hold a hardcoded production connection string.
// Scripts must connect through scripts/lib/stagingConnection.js (staging or local only).
console.error(
  "config/onRenderConnection.js is retired. Use require(\"../scripts/lib/stagingConnection\") instead."
);
process.exit(1);
