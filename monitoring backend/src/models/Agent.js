const mongoose = require("mongoose");
const crypto = require("crypto");

const agentSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔐 Agent authentication token (AUTO GENERATED)
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(32).toString("hex"),
    },

    /* ================= STATUS ================= */
    status: {
      type: String,
      enum: ["HEALTHY", "DEGRADED", "UNHEALTHY", "OFFLINE"],
      default: "OFFLINE",
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

/* ================= SAFETY ================= */
// Prevent model overwrite in dev / nodemon
module.exports =
  mongoose.models.Agent || mongoose.model("Agent", agentSchema);
