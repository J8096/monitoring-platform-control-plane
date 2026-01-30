const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Sla",
  new mongoose.Schema({
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
    availability24h: Number,
    availability7d: Number,
    availability30d: Number,
    breached: Boolean,
  })
);
