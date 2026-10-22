// Drops and reseeds users + bubblywaters, so it needs an explicit flag (checked before connecting)
if (!process.argv.includes("--yes-drop-staging")) {
  console.error(
    "seed.js drops the users and bubblywaters collections. Re-run with --yes-drop-staging if you mean it."
  );
  process.exit(1);
}
const db = require("../scripts/lib/stagingConnection");
const { User, BubblyWater } = require("../models");
const userSeeds = require("./userSeeds.json");
const bubblyWaterSeeds = require("./bubblyWaterSeeds.json");
const cleanDB = require("./cleanDB");

db.once("open", async () => {
  try {
    await cleanDB("User", "users");
    await cleanDB("BubblyWater", "bubblywaters");

    await User.create(userSeeds);
    await BubblyWater.create(bubblyWaterSeeds);

    await console.log("~ User Data and Bubbly Water Data Seeded 🌱~");
    process.exit(0);
  } catch (err) {
    throw err;
  }
});
