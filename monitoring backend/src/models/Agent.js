const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: true,
    },

    // 🔐 REQUIRED for agent authentication
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    /* ================= STATUS ================= */
    status: {
      type: String,
      enum: ["HEALTHY", "DEGRADED", "UNHEALTHY", "OFFLINE"],
      default: "OFFLINE", // ⬅️ IMPORTANT
    },

    lastHeartbeat: Date,

    /* ================= METRICS ================= */
    cpu: {
      type: Number,
      min: 0,
      max: 100,
    },

    memory: {
      type: Number,
      min: 0,
      max: 100,
    },

    heartbeatAgeSec: Number,

    missedHeartbeats: {
      type: Number,
      default: 0,
    },

    /* ================= HEALTH ================= */
    availability24h: {
      type: Number,
      default: 100,
    },

    healthScore: {
      type: Number,
      default: 100,
    },

    healthReasons: [String],

    /* ================= METADATA ================= */
    metadata: {
      os: String,
      version: String,
      environment: String,
      hostname: String,
    },
  },
  { timestamps: true }
);

// Prevent overwrite error (hot reload safe)
module.exports =
  mongoose.models.Agent ||
  mongoose.model("Agent", agentSchema);
