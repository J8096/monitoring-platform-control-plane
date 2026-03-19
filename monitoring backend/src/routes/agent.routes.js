const express = require("express");
const crypto = require("crypto");

const Agent = require("../models/Agent");
const Metric = require("../models/Metric");
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
    console.error("❌ Load agents failed:", err);
    res.status(500).json({ message: "Failed to load agents" });
  }
});

/* ============================
   POST /agents (CREATE)
============================ */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, metadata } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Agent name is required" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const agent = await Agent.create({
      name: name.trim(),
      token,
      status: "OFFLINE",
      metadata,
      lastHeartbeat: null,
      missedHeartbeats: 0,
    });

    // Return token only once — it cannot be recovered
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
   DELETE /agents/:id
============================ */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const agent = await Agent.findByIdAndDelete(req.params.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ message: "Agent deleted" });
  } catch (err) {
    console.error("❌ Delete agent failed:", err);
    res.status(500).json({ message: "Failed to delete agent" });
  }
});

/* ============================
   POST /agents/:id/heartbeat
   Agent token auth (Bearer)
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
      return res.status(400).json({ message: "cpu and memory must be numbers" });
    }

    if (cpu < 0 || cpu > 100 || memory < 0 || memory > 100) {
      return res.status(400).json({ message: "cpu and memory must be 0–100" });
    }

    const agent = await Agent.findOne({ _id: id, token });
    if (!agent) {
      return res.status(401).json({ message: "Invalid agent credentials" });
    }

    /* ── Update agent ── */
    agent.cpu = cpu;
    agent.memory = memory;
    agent.status = "HEALTHY";
    agent.lastHeartbeat = new Date();
    agent.missedHeartbeats = 0;
    if (metadata) agent.metadata = { ...agent.metadata, ...metadata };

    await agent.save();

    /* ── Save metric ── */
    const metric = await Metric.create({ agent: agent._id, cpu, memory });

    /* ── Live metrics via Socket.IO ── */
    const io = req.app.get("io");
    if (io) {
      io.to(agent._id.toString()).emit("metrics:update", {
        agentId: agent._id,
        cpu,
        memory,
        timestamp: Date.now(),
      });
    }

    /* ── Threshold checks ── */
    await checkThreshold({
      agentId: agent._id,
      type: "CPU_HIGH",
      value: cpu,
      threshold: 90,
      severity: "P2",
      message: `CPU usage high (${cpu}%) on ${agent.name}`,
    });

    await checkThreshold({
      agentId: agent._id,
      type: "MEMORY_HIGH",
      value: memory,
      threshold: 90,
      severity: "P2",
      message: `Memory usage high (${memory}%) on ${agent.name}`,
    });

    res.json({ ok: true, metricId: metric._id });
  } catch (err) {
    console.error("❌ Heartbeat error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
