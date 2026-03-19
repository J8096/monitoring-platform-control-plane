const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      index: true,
    },

    agent: {
      type: String, // agent name / hostname for display
    },

    severity: {
      type: String,
      enum: ["P1", "P2", "P3", "P4"],
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["CPU", "MEMORY", "OFFLINE", "CUSTOM"],
      default: "CUSTOM",
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["OPEN", "RESOLVED"],
      default: "OPEN",
      index: true,
    },

    acknowledged: {
      type: Boolean,
      default: false,
    },

    acknowledgedBy: String,
    acknowledgedAt: Date,

    resolvedAt: Date,
    resolvedBy: String,

    alertIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Alert",
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Incident || mongoose.model("Incident", IncidentSchema);
