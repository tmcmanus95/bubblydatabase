const db = require("../config/connection");
const { BubblyWater } = require("../models");
const newSeeds = require("./newSeeds.json");

db.once("open", async () => {
  try {
    await BubblyWater.create(newSeeds);
    await console.log("~Additional Seeds added ! 🌱 📈 ~");
    process.exit(0);
  } catch (err) {
    throw err;
  }
});
