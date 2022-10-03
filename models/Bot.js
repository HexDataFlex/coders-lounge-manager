const mongoose = require("mongoose");

const BotSchema = new mongoose.Schema({
  name: String,
  prefix: String,
  clientId: String,
  ownerId: String,
  status: String, // 0 = submitted, 1 = checking, 2 = approved, 3 = decline
});

module.exports = mongoose.model("Bot", BotSchema);
