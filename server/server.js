require("dotenv").config();
const { createApp } = require("./app");

const db = require("./config/connection");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  const { app } = await createApp();

  db.once("open", () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
  });
};

startServer();
