const db = require("../config/onRenderConnection");
const fs = require("fs");
const path = require("path");

const { BubblyWater } = require("../models");
const newSeeds = require("./newSeeds.json");
const existingSeedsPath = path.join(__dirname, "bubblyWaterSeeds.json");

db.once("open", async () => {
  try {
    let existingSeeds = [];
    if (fs.existsSync(existingSeedsPath)) {
      const data = fs.readFileSync(existingSeedsPath, "utf-8");
      existingSeeds = JSON.parse(data);
    }

    const combinedSeeds = [...existingSeeds, ...newSeeds];

    fs.writeFileSync(
      existingSeedsPath,
      JSON.stringify(combinedSeeds, null, 2),
      "utf-8"
    );

    await BubblyWater.create(newSeeds);
    console.log("~Additional Seeds added ! 🌱 📈 ~");
    process.exit(0);
  } catch (err) {
    console.error("Error adding seeds:", err);
    process.exit(1);
  }
});
