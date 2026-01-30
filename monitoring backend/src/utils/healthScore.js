function calculateHealth({ heartbeatAgeSec = null, missedHeartbeats = 0 }) {
  let score = 100;
  const reasons = [];

  if (heartbeatAgeSec > 15) {
    score -= 20;
    reasons.push("Heartbeat delayed");
  }

  if (heartbeatAgeSec > 60) {
    score -= 50;
    reasons.push("Agent possibly offline");
  }

  if (missedHeartbeats > 0) {
    score -= missedHeartbeats * 5;
    reasons.push(`${missedHeartbeats} missed heartbeats`);
  }

  if (score < 0) score = 0;

  let status = "HEALTHY";
  if (score < 80) status = "DEGRADED";
  if (score < 50) status = "UNHEALTHY";
  if (heartbeatAgeSec > 120) status = "OFFLINE";

  return { score, status, reasons };
}

module.exports = { calculateHealth };
