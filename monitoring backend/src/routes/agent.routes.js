const express = require("express");
const crypto = require("crypto");

const Agent = require("../models/Agent");
const Metric = require("../models/metric1");
const requireAuth = require("../middleware/requireAuth");
const { checkThreshold } = require("../utils/thresholdChecker");

const router = express.Router();

/* ============================
   GET /agents (AUTH REQUIRED)
============================ */
router.get("/", requireAuth, async (req, res) => {
  try {
    const agents = await Agent.find().sort({ updatedAt: -1 });
    res.json(agents);
  } catch (err) {
    console.error("❌ Load agents failed:", err);
    res.status(500).json({ message: "Failed to load agents" });
  }
});

/* ============================
   POST /agents (CREATE AGENT)
============================ */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, metadata } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Agent name required" });
    }

    // 🔐 Secure token (shown once)
    const token = crypto.randomBytes(32).toString("hex");

    const agent = await Agent.create({
      name,
      token,
      status: "OFFLINE",
      metadata,
      lastHeartbeat: null,
      missedHeartbeats: 0,
    });

    res.status(201).json({
      _id: agent._id,
      name: agent.name,
      token,
    });
  } catch (err) {
    console.error("❌ Create agent failed:", err);
    res.status(500).json({ message: "Failed to create agent" });
  }
});

/* ============================
   POST /agents/:id/heartbeat
   (AGENT TOKEN AUTH)
============================ */
router.post("/:id/heartbeat", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const { id } = req.params;
    const { cpu, memory, metadata } = req.body;

    if (!token) {
      return res.status(401).json({ message: "Missing agent token" });
    }

    if (typeof cpu !== "number" || typeof memory !== "number") {
      return res.status(400).json({ message: "Invalid metrics payload" });
    }

    const agent = await Agent.findOne({ _id: id, token });
    if (!agent) {
      return res.status(401).json({ message: "Invalid agent credentials" });
    }

    /* ================= UPDATE AGENT ================= */
    agent.cpu = cpu;
    agent.memory = memory;
    agent.status = "HEALTHY";
    agent.lastHeartbeat = new Date();
    agent.missedHeartbeats = 0;
    agent.metadata = { ...agent.metadata, ...metadata };

    await agent.save();

    /* ================= SAVE METRIC ================= */
    const metric = await Metric.create({
      agent: agent._id,
      cpu,
      memory,
    });

    /* ================= LIVE METRICS (SOCKET.IO) ================= */
    const io = req.app.get("io");
    if (io) {
      io.to(agent._id.toString()).emit("metrics:update", {
        agentId: agent._id,
        cpu,
        memory,
        timestamp: Date.now(),
      });
    }

    /* ================= ALERTS ================= */
    await checkThreshold({
      agent: agent._id,
      type: "CPU_HIGH",
      value: cpu,
      threshold: 90,
      severity: "P2",
      message: `CPU usage high (${cpu}%)`,
    });

    await checkThreshold({
      agent: agent._id,
      type: "MEMORY_HIGH",
      value: memory,
      threshold: 90,
      severity: "P2",
      message: `Memory usage high (${memory}%)`,
    });

    res.json({ ok: true, metricId: metric._id });
  } catch (err) {
    console.error("❌ Heartbeat error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
