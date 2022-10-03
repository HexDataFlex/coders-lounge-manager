const mongoose = require("mongoose");
const { mongo } = require("./config.json");

class Database {
  constructor() {
    this.connection = null;
  }

  connect() {
    console.log("Connencting to the database...");

    mongoose
      .connect(mongo, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("Connected to the database");
        this.connection = mongoose.connection;
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

module.exports = Database;
