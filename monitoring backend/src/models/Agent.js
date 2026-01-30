const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
  {
    name: String,

    status: {
      type: String,
      enum: ["HEALTHY", "DEGRADED", "UNHEALTHY", "OFFLINE"],
      default: "HEALTHY",
    },

    lastHeartbeat: Date,

    // NEW — enterprise fields
    heartbeatAgeSec: Number,
    missedHeartbeats: {
      type: Number,
      default: 0,
    },

    availability24h: {
      type: Number,
      default: 100,
    },

    healthScore: {
      type: Number,
      default: 100,
    },

    healthReasons: [String],

    metadata: {
      os: String,
      version: String,
      environment: String,
    },
  },
  { timestamps: true }
);

// Prevent overwrite error
module.exports =
  mongoose.models.Agent ||
  mongoose.model("Agent", agentSchema);
