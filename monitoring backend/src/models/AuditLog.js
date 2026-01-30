const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    actor: String, // email
    action: String, // ACK_ALERT, RESOLVE_INCIDENT
    targetType: String, // ALERT | INCIDENT
    targetId: mongoose.Schema.Types.ObjectId,
    metadata: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
