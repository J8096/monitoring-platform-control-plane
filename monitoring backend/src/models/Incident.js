const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      index: true,
    },

    // 👇 REQUIRED BY UI
    agent: {
      type: String, // agent name / hostname
    },

    severity: {
      type: String,
      enum: ["P1", "P2", "P3", "P4"],
      required: true,
      index: true,
    },

    // 👇 REQUIRED BY UI (filters + stats)
    type: {
      type: String,
      enum: ["CPU", "MEMORY", "OFFLINE"],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    // 👇 REQUIRED BY UI search
    message: {
      type: String,
    },

    status: {
      type: String,
      enum: ["OPEN", "RESOLVED"],
      default: "OPEN",
      index: true,
    },

    // 👇 REQUIRED BY UI
    acknowledged: {
      type: Boolean,
      default: false,
    },

    acknowledgedBy: {
      type: String,
    },

    resolvedAt: Date,
    resolvedBy: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", IncidentSchema);
