const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },

    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      index: true,
    },

    type: {
      type: String,
      required: true,
      index: true,
    },

    severity: {
      type: String,
      enum: ["P1", "P2", "P3", "P4"],
      default: "P3",
      index: true,
    },

    message: {
      type: String,
      required: true,
    },

    acknowledgedAt: Date,
    acknowledgedBy: String,
    resolvedAt: Date,
  },
  { timestamps: true }
);

/* ================= VIRTUAL STATUS ================= */
AlertSchema.virtual("status").get(function () {
  if (this.resolvedAt) return "RESOLVED";
  if (this.acknowledgedAt) return "ACKNOWLEDGED";
  return "OPEN";
});

AlertSchema.set("toJSON", { virtuals: true });
AlertSchema.set("toObject", { virtuals: true });

/* ================= TTL INDEX ================= */
/* Auto-delete alerts after 7 days */
AlertSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 7 }
);

/* 🔥 CRITICAL EXPORT (DO NOT CHANGE) */
module.exports = mongoose.model("Alert", AlertSchema);
