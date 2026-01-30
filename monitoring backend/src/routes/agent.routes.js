const express = require("express");
const Agent = require("../models/Agent");
const Metric = require("../models/metric1");
const requireAuth = require("../middleware/requireAuth");
const { checkThreshold } = require("../utils/thresholdChecker");

const router = express.Router();

/* ============================
   GET /agents
============================ */
router.get("/", requireAuth, async (req, res) => {
  try {
    const agents = await Agent.find().sort({ updatedAt: -1 });
    res.json(agents);
  } catch (err) {
    console.error("Load agents failed:", err);
    res.status(500).json({ message: "Failed to load agents" });
  }
});

/* ============================
   POST /agents/heartbeat
============================ */
router.post("/heartbeat", async (req, res) => {
  try {
    const { name, cpu, memory } = req.body;

    if (!name || typeof cpu !== "number" || typeof memory !== "number") {
      return res.status(400).json({ message: "Invalid payload" });
    }

    /* FIND OR CREATE AGENT */
    let agent = await Agent.findOne({ name });

    if (!agent) {
      agent = await Agent.create({
        name,
        status: "HEALTHY",
        lastHeartbeat: new Date(),
      });
    } else {
      agent.lastHeartbeat = new Date();
      agent.status = "HEALTHY";
      await agent.save();
    }

    /* SAVE METRIC (✅ FIXED FIELD) */
    const metric = await Metric.create({
      agent: agent._id, // ✅ correct
      cpu,
      memory,
    });

    /* CPU ALERT */
    await checkThreshold({
      agent: agent._id, // ✅ consistent
      type: "CPU_HIGH",
      value: cpu,
      threshold: 90,
      severity: "P2",
      message: `CPU usage high (${cpu}%)`,
    });

    /* MEMORY ALERT */
    await checkThreshold({
      agent: agent._id, // ✅ consistent
      type: "MEMORY_HIGH",
      value: memory,
      threshold: 90,
      severity: "P2",
      message: `Memory usage high (${memory}%)`,
    });

    res.json({
      message: "Heartbeat processed",
      agentId: agent._id,
      metricId: metric._id,
    });
  } catch (err) {
    console.error("❌ Heartbeat error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
