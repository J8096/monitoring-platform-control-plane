const Incident = require("../models/Incident");
const IncidentEvent = require("../models/IncidentEvent");
const Alert = require("../models/Alert");

/**
 * Acknowledge an incident (human action)
 */
async function acknowledgeIncident(incidentId, user) {
  if (!incidentId) return null;

  const incident = await Incident.findById(incidentId);
  if (!incident) return null;

  // Already resolved → no-op
  if (incident.status === "RESOLVED") {
    return incident;
  }

  incident.acknowledgedBy = user?.email || "system";
  incident.acknowledgedAt = new Date();
  await incident.save();

  await IncidentEvent.create({
    incidentId: incident._id,
    type: "ACKNOWLEDGED",
    actor: user?.email || "system",
    message: "Incident acknowledged",
  });

  return incident;
}

/**
 * Resolve an incident manually (admin action)
 * Also resolves all related alerts
 */
async function resolveIncident(incidentId, user) {
  if (!incidentId) return null;

  const incident = await Incident.findById(incidentId);
  if (!incident) return null;

  // Already resolved → no-op
  if (incident.status === "RESOLVED") {
    return incident;
  }

  // ✅ Resolve all OPEN alerts linked to this incident
  await Alert.updateMany(
    {
      incidentId: incident._id,
      status: { $ne: "RESOLVED" },
    },
    {
      status: "RESOLVED",
      resolvedAt: new Date(),
    }
  );

  incident.status = "RESOLVED";
  incident.resolvedAt = new Date();
  incident.resolvedBy = user?.email || "system";
  await incident.save();

  await IncidentEvent.create({
    incidentId: incident._id,
    type: "RESOLVED",
    actor: user?.email || "system",
    message: "Incident manually resolved",
  });

  return incident;
}

module.exports = {
  acknowledgeIncident,
  resolveIncident,
};
