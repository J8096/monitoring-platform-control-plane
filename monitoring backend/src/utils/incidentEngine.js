const Incident = require("../models/Incident");
const Alert = require("../models/Alert");

/**
 * Attach an alert to an open incident
 * or create a new incident
 */
async function attachAlertToIncident(alert) {
  let incident = await Incident.findOne({
    agent: alert.agent,
    type: alert.type,
    status: { $ne: "RESOLVED" },
  });

  if (!incident) {
    incident = await Incident.create({
      agent: alert.agent,
      type: alert.type,
      title: `${alert.type} issue on agent`,
    });
  }

  alert.incident = incident._id;
  await alert.save();

  return incident;
}

/**
 * Resolve incident if all alerts resolved
 */
async function tryResolveIncident(incidentId) {
  const openAlerts = await Alert.countDocuments({
    incident: incidentId,
    resolvedAt: null,
  });

  if (openAlerts === 0) {
    await Incident.findByIdAndUpdate(incidentId, {
      status: "RESOLVED",
      resolvedAt: new Date(),
    });
  }
}

module.exports = {
  attachAlertToIncident,
  tryResolveIncident,
};
