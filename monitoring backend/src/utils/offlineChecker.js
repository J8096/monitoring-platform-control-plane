const Agent = require("../models/Agent");
const Alert = require("../models/Alert");
const { calculateHealth } = require("./healthScore");
const {
  attachAlertToIncident,
  tryResolveIncident,
} = require("../services/incidentMatcher");

const HEARTBEAT_INTERVAL_SEC = 5;
const OFFLINE_THRESHOLD_SEC = 60;

/**
 * Background job:
 * - Updates agent health
 * - Creates OFFLINE alerts (once)
 * - Resolves OFFLINE alerts on recovery
 * - Emits live status updates via Socket.IO
 */
async function runOfflineCheck(io) {
  try {
    const now = Date.now();
    const agents = await Agent.find();

    for (const agent of agents) {
      const last = agent.lastHeartbeat
        ? new Date(agent.lastHeartbeat).getTime()
        : null;

      const heartbeatAgeSec = last
        ? Math.floor((now - last) / 1000)
        : null;

      const missedHeartbeats =
        heartbeatAgeSec && heartbeatAgeSec > HEARTBEAT_INTERVAL_SEC
          ? Math.floor(heartbeatAgeSec / HEARTBEAT_INTERVAL_SEC)
          : 0;

      const health = calculateHealth({
        heartbeatAgeSec,
        missedHeartbeats,
      });

      const prevStatus = agent.status;

      /* ================= UPDATE AGENT ================= */
      agent.heartbeatAgeSec = heartbeatAgeSec;
      agent.missedHeartbeats = missedHeartbeats;
      agent.healthScore = health.score;
      agent.healthReasons = health.reasons;
      agent.status = health.status;

      // 🔐 IMPORTANT: token is REQUIRED → never touch it
      await agent.save();

      /* ================= LIVE UPDATE ================= */
      if (io) {
        io.to(agent._id.toString()).emit("agent:status", {
          agentId: agent._id,
          status: agent.status,
          healthScore: agent.healthScore,
          reasons: agent.healthReasons,
        });
      }

      /* ================= OFFLINE TRANSITION ================= */
      if (prevStatus !== "OFFLINE" && health.status === "OFFLINE") {
        const existing = await Alert.findOne({
          agentId: agent._id,
          type: "OFFLINE",
          resolvedAt: null,
        });

        if (!existing) {
          const alert = await Alert.create({
            agentId: agent._id,
            type: "OFFLINE",
            severity: "P1",
            message: `Agent ${agent.name} went offline`,
          });

          await attachAlertToIncident(alert);
        }
      }

      /* ================= RECOVERY TRANSITION ================= */
      if (prevStatus === "OFFLINE" && health.status !== "OFFLINE") {
        const openOfflineAlerts = await Alert.find({
          agentId: agent._id,
          type: "OFFLINE",
          resolvedAt: null,
        });

        for (const alert of openOfflineAlerts) {
          alert.resolvedAt = new Date();
          await alert.save();

          if (alert.incidentId) {
            await tryResolveIncident(alert.incidentId, "system");
          }
        }
      }
    }
  } catch (err) {
    console.error("❌ Offline checker failed:", err.message);
  }
}

module.exports = runOfflineCheck;
