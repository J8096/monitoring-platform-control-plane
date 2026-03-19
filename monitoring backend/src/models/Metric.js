const mongoose = require("mongoose");

const MetricSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },
    cpu: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    memory: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

/* ================= TTL INDEX ================= */
/* Auto-delete metrics after 24 hours */
MetricSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 }
);

/**
 * Prevent model overwrite in dev (nodemon / vite)
 */
module.exports =
  mongoose.models.Metric || mongoose.model("Metric", MetricSchema);
