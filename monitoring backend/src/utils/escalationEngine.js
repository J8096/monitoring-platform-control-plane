/**
 * Escalation Engine
 * Determines the effective severity for an incident
 * based on its attached alerts, time open, and acknowledgement status.
 */

/**
 * Compute the escalated severity for an incident from its alerts.
 * P1 > P2 > P3 > P4 — worst alert wins.
 *
 * @param {Array<{severity: string}>} alerts
 * @returns {string} - P1 | P2 | P3 | P4
 */
function escalateSeverity(alerts = []) {
  const PRIORITY = { P1: 1, P2: 2, P3: 3, P4: 4 };

  if (!alerts.length) return "P4";

  return alerts.reduce((worst, alert) => {
    const alertPriority = PRIORITY[alert.severity] ?? 4;
    const worstPriority = PRIORITY[worst] ?? 4;
    return alertPriority < worstPriority ? alert.severity : worst;
  }, "P4");
}

/**
 * Determine if an incident should auto-escalate based on age.
 * Unacknowledged P2+ incidents older than 30 minutes → escalate to P1.
 *
 * @param {Object} incident - Mongoose incident document
 * @returns {{ shouldEscalate: boolean, reason: string|null }}
 */
function shouldAutoEscalate(incident) {
  if (incident.acknowledged) return { shouldEscalate: false, reason: null };
  if (incident.status === "RESOLVED")  return { shouldEscalate: false, reason: null };

  const ageMinutes = (Date.now() - new Date(incident.createdAt).getTime()) / 60_000;

  if (incident.severity === "P2" && ageMinutes > 30) {
    return {
      shouldEscalate: true,
      reason: `P2 incident open and unacknowledged for ${Math.round(ageMinutes)} minutes`,
    };
  }

  if (incident.severity === "P3" && ageMinutes > 120) {
    return {
      shouldEscalate: true,
      reason: `P3 incident open and unacknowledged for ${Math.round(ageMinutes)} minutes`,
    };
  }

  return { shouldEscalate: false, reason: null };
}

module.exports = { escalateSeverity, shouldAutoEscalate };
