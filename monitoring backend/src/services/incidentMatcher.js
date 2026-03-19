const Incident      = require("../models/Incident");
const IncidentEvent = require("../models/IncidentEvent");
const Alert         = require("../models/Alert");

/**
 * Attach alert to an existing open incident for this agent,
 * or create a new one if none exists.
 */
async function attachAlertToIncident(alert) {
  let incident = await Incident.findOne({
    agentId: alert.agentId,
    status: { $ne: "RESOLVED" },
  });

  if (!incident) {
    // Derive incident type from alert type
    const typeMap = {
      CPU_HIGH:    "CPU",
      MEMORY_HIGH: "MEMORY",
      OFFLINE:     "OFFLINE",
    };
    const incidentType = typeMap[alert.type] || "CUSTOM";

    incident = await Incident.create({
      agentId:  alert.agentId,
      severity: alert.severity,
      type:     incidentType,
      title:    alert.message,
      alertIds: [alert._id],
    });

    await IncidentEvent.create({
      incidentId: incident._id,
      type:       "CREATED",
      message:    "Incident created from alert",
    });
  } else {
    if (!incident.alertIds.some(id => id.equals(alert._id))) {
      incident.alertIds.push(alert._id);
      await incident.save();

      await IncidentEvent.create({
        incidentId: incident._id,
        type:       "ALERT_ATTACHED",
        message:    `Alert attached: ${alert.message}`,
      });
    }
  }

  alert.incidentId = incident._id;
  await alert.save();

  return incident;
}

/**
 * Auto-resolve incident when all its alerts are resolved.
 */
async function tryResolveIncident(incidentId, actor = "system") {
  const openAlerts = await Alert.countDocuments({ incidentId, resolvedAt: null });

  if (openAlerts === 0) {
    const incident = await Incident.findById(incidentId);
    if (!incident || incident.status === "RESOLVED") return;

    incident.status     = "RESOLVED";
    incident.resolvedAt = new Date();
    await incident.save();

    await IncidentEvent.create({
      incidentId,
      type:    "RESOLVED",
      actor,
      message: "Incident auto-resolved (all alerts resolved)",
    });
  }
}

module.exports = { attachAlertToIncident, tryResolveIncident };
