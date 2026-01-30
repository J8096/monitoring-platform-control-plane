const express = require("express");
const mongoose = require("mongoose");
const Metric = require("../models/metric1");
const auth = require("../middleware/requireAuth");

const router = express.Router();

/**
 * GET /metrics/:agentId
 * Query params:
 *   - range: 5m | 1h | 24h (default: 5m)
 */
router.get("/:agentId", auth, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { range = "5m" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ message: "Invalid agent id" });
    }

    /* ================= TIME RANGE ================= */
    const RANGE_MAP = {
      "5m": 5 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
    };

    const duration = RANGE_MAP[range] || RANGE_MAP["5m"];
    const since = new Date(Date.now() - duration);

    /* ================= QUERY ================= */
    const metrics = await Metric.find(
      {
        agent: agentId,
        createdAt: { $gte: since },
      },
      {
        cpu: 1,
        memory: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: 1 }) // oldest → newest
      .limit(500)
      .lean();

    /* ================= NORMALIZE ================= */
    const normalized = metrics.map((m) => ({
      cpu: m.cpu,
      memory: m.memory,
      timestamp: m.createdAt,
    }));

    res.json(normalized);
  } catch (err) {
    console.error("❌ Metrics fetch failed:", err);
    res.status(500).json({ message: "Failed to load metrics" });
  }
});

module.exports = router;
