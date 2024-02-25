const db = require("../config/connection");
const { User, BubblyWater } = require("../models");
const userSeeds = require("./userSeeds.json");
const bubblyWaterSeeds = require("./bubblyWaterSeeds.json");
const cleanDB = require("./cleanDB");

db.once("open", async () => {
  try {
    await cleanDB("User", "users");
    await cleanDB("BubblyWater", "bubblyWaters");

    await User.create(userSeeds);
    await BubblyWater.create(bubblyWaterSeeds);

    await console.log("~ User Data and Bubbly Water Data Seeded 🌱~");
    process.exit(0);
  } catch (err) {
    throw err;
  }
});
