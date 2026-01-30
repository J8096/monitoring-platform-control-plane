const mongoose = require("mongoose");

const IncidentEventSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "CREATED",
        "ALERT_ATTACHED",
        "ACKNOWLEDGED",
        "RESOLVED",
        "COMMENT",
      ],
      required: true,
      index: true,
    },

    actor: {
      type: String,
      default: "system", // system | userId | service-name
      index: true,
    },

    message: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/**
 * Index for fast incident timeline loading
 */
IncidentEventSchema.index({ incidentId: 1, createdAt: 1 });

module.exports = mongoose.model("IncidentEvent", IncidentEventSchema);
