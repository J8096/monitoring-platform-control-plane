const Metric = require("../models/Metric");
const { io } = require("../server");

/**
 * Save metric and emit real-time update
 */
async function saveMetric(agentId, metric) {
  const saved = await Metric.create({
    ...metric,
    agent: agentId,
  });

  // 🔥 WebSocket push
  io.to(agentId.toString()).emit("metrics:update", saved);

  return saved;
}

module.exports = { saveMetric };
