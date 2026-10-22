const models = require("../models");
const db = require("../scripts/lib/stagingConnection");
const { checkStagingUri } = require("../scripts/lib/assertStaging");

module.exports = async (modelName, collectionName) => {
  // Second check against the database we actually connected to, right before dropping anything
  const connected = checkStagingUri(`mongodb://${db.host}/${db.name}`);
  if (!connected.ok) {
    throw new Error(connected.reason);
  }
  try {
    let modelExists = await models[modelName].db.db
      .listCollections({
        name: collectionName,
      })
      .toArray();

    if (modelExists.length) {
      await db.dropCollection(collectionName);
    }
  } catch (err) {
    throw err;
  }
};
