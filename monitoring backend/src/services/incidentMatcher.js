const Incident = require("../models/Incident");
const IncidentEvent = require("../models/IncidentEvent");
const Alert = require("../models/Alert");

/**
 * Attach alert to an existing open incident
 * OR create a new incident if none exists
 */
async function attachAlertToIncident(alert) {
  // 1️⃣ Find existing open incident for same agent
  let incident = await Incident.findOne({
    agentId: alert.agentId,
    status: { $ne: "RESOLVED" },
  });

  // 2️⃣ Create new incident if none exists
  if (!incident) {
    incident = await Incident.create({
      agentId: alert.agentId,
      severity: alert.severity,
      title: alert.message,
      alertIds: [alert._id],
    });

    await IncidentEvent.create({
      incidentId: incident._id,
      type: "CREATED",
      message: "Incident created from alert",
    });
  } else {
    // 3️⃣ Attach alert if not already linked
    if (!incident.alertIds.some(id => id.equals(alert._id))) {
      incident.alertIds.push(alert._id);
      await incident.save();

      await IncidentEvent.create({
        incidentId: incident._id,
        type: "ALERT_ATTACHED",
        message: `Alert attached: ${alert.message}`,
      });
    }
  }

  // 4️⃣ Link alert → incident
  alert.incidentId = incident._id;
  await alert.save();

  return incident;
}

/**
 * Resolve incident automatically
 * when all linked alerts are resolved
 */
async function tryResolveIncident(incidentId, actor = "system") {
  const openAlerts = await Alert.countDocuments({
    incidentId,
    resolvedAt: null,
  });

  if (openAlerts === 0) {
    const incident = await Incident.findById(incidentId);
    if (!incident || incident.status === "RESOLVED") return;

    incident.status = "RESOLVED";
    incident.resolvedAt = new Date();
    await incident.save();

    await IncidentEvent.create({
      incidentId,
      type: "RESOLVED",
      actor,
      message: "Incident auto-resolved (all alerts resolved)",
    });
  }
}

module.exports = {
  attachAlertToIncident,
  tryResolveIncident,
};
