const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://tmcmanus95:Onionflower24@cluster0.ls0trnd.mongodb.net/bubblydatabase3?retryWrites=true&w=majority&appName=Cluster0"
);

module.exports = mongoose.connection;
