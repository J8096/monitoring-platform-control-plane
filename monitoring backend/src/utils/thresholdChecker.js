const Alert = require("../models/Alert");
const { attachAlertToIncident, tryResolveIncident } = require("../services/incidentMatcher");

/**
 * Generic threshold checker — CPU, Memory, Disk, etc.
 * Creates an alert when a metric exceeds threshold,
 * resolves it when the metric recovers.
 *
 * @param {Object} opts
 * @param {ObjectId} opts.agentId
 * @param {string}   opts.type      - e.g. "CPU_HIGH"
 * @param {number}   opts.value     - current metric value
 * @param {number}   opts.threshold - breach level
 * @param {string}   opts.severity  - P1 | P2 | P3 | P4
 * @param {string}   opts.message   - human-readable description
 */
async function checkThreshold({ agentId, type, value, threshold, severity, message }) {
  if (!agentId) return;

  if (value >= threshold) {
    // Already have an open alert — skip duplicate
    const existing = await Alert.findOne({ agentId, type, resolvedAt: null });
    if (!existing) {
      const alert = await Alert.create({ agentId, type, severity, message });
      await attachAlertToIncident(alert);
    }
    return;
  }

  // Metric recovered — resolve open alerts
  const openAlerts = await Alert.find({ agentId, type, resolvedAt: null });
  for (const alert of openAlerts) {
    alert.resolvedAt = new Date();
    await alert.save();

    if (alert.incidentId) {
      await tryResolveIncident(alert.incidentId, "system");
    }
  }
}

module.exports = { checkThreshold };
