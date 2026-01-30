const Alert = require("../models/Alert");
const { attachAlertToIncident, tryResolveIncident } = require("../services/incidentMatcher");

/**
 * Generic threshold checker
 * Used for CPU, Memory, Disk, etc.
 */
async function checkThreshold({
  agentId,
  metric,
  value,
  threshold,
  severity,
  message,
}) {
  if (!agentId) return;

  // 🔴 Threshold breached
  if (value >= threshold) {
    const existing = await Alert.findOne({
      agentId,
      type: metric,
      resolvedAt: null,
    });

    if (!existing) {
      const alert = await Alert.create({
        agentId,                // ✅ REQUIRED
        type: metric,
        severity,
        message,
      });

      await attachAlertToIncident(alert);
    }

    return;
  }

  //  Threshold recovered
  const openAlerts = await Alert.find({
    agentId,
    type: metric,
    resolvedAt: null,
  });

  for (const alert of openAlerts) {
    alert.resolvedAt = new Date();
    await alert.save();

    if (alert.incidentId) {
      await tryResolveIncident(alert.incidentId, "system");
    }
  }
}

module.exports = {
  checkThreshold,
};
