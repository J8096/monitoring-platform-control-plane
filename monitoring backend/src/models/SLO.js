const mongoose = require("mongoose");

const SLOSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      unique: true,
    },
    uptimePct: Number,
    errorBudgetRemaining: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("SLO", SLOSchema);
