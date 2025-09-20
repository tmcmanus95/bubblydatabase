const cron = require("node-cron");
const { updateTopReviews } = require("./utils/updateTopReviews");

const setupScheduledTasks = () => {
  // Run every day at 2 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("Running scheduled top reviews update...");
    await updateTopReviews();
  });

  // Optional: Run on server startup for immediate update
  console.log("Running initial top reviews update...");
  updateTopReviews();
};

module.exports = { setupScheduledTasks };
